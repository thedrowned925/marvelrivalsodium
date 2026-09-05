-- Dedicated project. All writes go through the authenticated Edge Function.
create extension if not exists supabase_vault with schema vault;
create table public.rivals_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
 singleton boolean not null default true unique check (singleton),
 created_at timestamptz not null default now()
);
create table public.rivals_control (
 id boolean primary key default true check (id),
 bootstrap_hash text,
 lock_id uuid,
 lock_until timestamptz
);
insert into public.rivals_control(id) values(true);
create table public.rivals_audio_tracks (
 character text primary key check (character ~ '^[a-z0-9-]{1,60}$'),
 hover_url text, detail_url text,
 hover_path text, detail_path text,
 commit_sha text,
 updated_at timestamptz not null default now()
);
create table public.rivals_audio_jobs (
 id uuid primary key, admin_id uuid not null references public.rivals_admins(user_id),
 character text not null, status text not null check (status in ('publishing','github_saved','published','failed')),
 track jsonb, commit_sha text, created_at timestamptz not null default now()
);
create table public.rivals_rate_limits (key text primary key, window_start timestamptz not null, count int not null);
alter table public.rivals_admins enable row level security;
alter table public.rivals_control enable row level security;
alter table public.rivals_audio_tracks enable row level security;
alter table public.rivals_audio_jobs enable row level security;
alter table public.rivals_rate_limits enable row level security;
revoke all on public.rivals_admins,public.rivals_control,public.rivals_audio_tracks,public.rivals_audio_jobs,public.rivals_rate_limits from anon,authenticated;
grant all on public.rivals_admins,public.rivals_control,public.rivals_audio_tracks,public.rivals_audio_jobs,public.rivals_rate_limits to service_role;
grant select on public.rivals_audio_tracks to anon,authenticated;
create policy "Public published audio" on public.rivals_audio_tracks for select to anon,authenticated using(true);
grant select on public.rivals_admins,public.rivals_audio_jobs to authenticated;
create policy "Own admin record" on public.rivals_admins for select to authenticated using((select auth.uid())=user_id);
create policy "Own publish jobs" on public.rivals_audio_jobs for select to authenticated using((select auth.uid())=admin_id);
alter publication supabase_realtime add table public.rivals_audio_tracks;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('rivals-audio','rivals-audio',true,10485760,array['audio/wav','audio/mpeg','audio/ogg']);
-- No browser INSERT/UPDATE/DELETE storage policies: service role uploads only.
create function public.rivals_rate_limit(bucket text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n int;
begin
 insert into public.rivals_rate_limits as r values(bucket,now(),1)
 on conflict(key) do update set count=case when r.window_start<now()-interval '1 minute' then 1 else r.count+1 end,window_start=case when r.window_start<now()-interval '1 minute' then now() else r.window_start end returning count into n;
 delete from public.rivals_rate_limits where window_start<now()-interval '1 day';
 return n<=20;
end $$;
create function public.rivals_acquire_lock(job uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.rivals_control set lock_id=job,lock_until=now()+interval '5 minutes' where id and (lock_until is null or lock_until<now());
 return found;
end $$;
create function public.rivals_release_lock(job uuid) returns void language sql security invoker set search_path='' as $$
 update public.rivals_control set lock_id=null,lock_until=null where lock_id=job;
$$;
create function public.rivals_finish_publish(job uuid) returns void language plpgsql security invoker set search_path='' as $$
declare j public.rivals_audio_jobs;
begin
 select * into j from public.rivals_audio_jobs where id=job for update;
 if j.status='published' then return; end if;
 if j.status<>'github_saved' or j.commit_sha is null or j.track is null then raise exception 'Job is not committed'; end if;
 insert into public.rivals_audio_tracks(character,hover_url,detail_url,hover_path,detail_path,commit_sha,updated_at)
 values(j.character,j.track->>'hover_url',j.track->>'detail_url',j.track->>'hover_path',j.track->>'detail_path',j.commit_sha,now())
 on conflict(character) do update set hover_url=excluded.hover_url,detail_url=excluded.detail_url,hover_path=excluded.hover_path,detail_path=excluded.detail_path,commit_sha=excluded.commit_sha,updated_at=excluded.updated_at;
 update public.rivals_audio_jobs set status='published' where id=job;
end $$;
-- Only the Edge Function's service role can read/write the encrypted credential.
grant usage on schema vault to service_role;
grant select on vault.decrypted_secrets to service_role;
grant select,insert,update on vault.secrets to service_role;
grant execute on function vault.create_secret(text,text,text,uuid) to service_role;
grant execute on function vault.update_secret(uuid,text,text,text,uuid) to service_role;
create function public.rivals_github_token() returns text language sql security invoker set search_path='' as $$
 select decrypted_secret from vault.decrypted_secrets where name='rivals_github_token' limit 1;
$$;
create function public.rivals_save_github_token(token text) returns void language plpgsql security invoker set search_path='' as $$
declare secret_id uuid;
begin
 if length(token)<20 or length(token)>500 then raise exception 'Invalid token'; end if;
 select id into secret_id from vault.secrets where name='rivals_github_token';
 if secret_id is null then perform vault.create_secret(token,'rivals_github_token','Rivals audio publisher');
 else perform vault.update_secret(secret_id,token); end if;
end $$;
-- Session revocation takes effect for privileged actions immediately.
grant usage on schema auth to service_role;
grant select(id,user_id,not_after) on auth.sessions to service_role;
create function public.rivals_session_valid(session uuid,account uuid) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from auth.sessions where id=session and user_id=account and (not_after is null or not_after>now()));
$$;
revoke all on function public.rivals_rate_limit(text),public.rivals_acquire_lock(uuid),public.rivals_release_lock(uuid),public.rivals_finish_publish(uuid),public.rivals_github_token(),public.rivals_save_github_token(text),public.rivals_session_valid(uuid,uuid) from public,anon,authenticated;
grant execute on function public.rivals_rate_limit(text),public.rivals_acquire_lock(uuid),public.rivals_release_lock(uuid),public.rivals_finish_publish(uuid),public.rivals_github_token(),public.rivals_save_github_token(text),public.rivals_session_valid(uuid,uuid) to service_role;
