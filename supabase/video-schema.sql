-- Character videos: private upload staging, GitHub video references, owner-only writes.
create table public.rivals_character_videos (
 character text primary key check(character ~ '^[a-z0-9-]{1,60}$'),
 video_url text not null, video_path text not null,
 duration double precision not null check(duration>0 and duration<=90),
 width int not null check(width=1920), height int not null check(height=1080),
 updated_at timestamptz not null default now()
);
create table public.rivals_video_uploads (
 id uuid primary key, admin_id uuid not null references public.rivals_admins(user_id),
 character text not null, path text not null unique,
 status text not null default 'uploading' check(status in ('uploading','publishing','github_saved','published','failed')),
 commit_sha text, duration double precision, created_at timestamptz not null default now()
);
alter table public.rivals_character_videos enable row level security;
alter table public.rivals_video_uploads enable row level security;
revoke all on public.rivals_character_videos,public.rivals_video_uploads from anon,authenticated;
grant all on public.rivals_character_videos,public.rivals_video_uploads to service_role;
grant select on public.rivals_character_videos to anon,authenticated;
create policy "Public character videos" on public.rivals_character_videos for select to anon,authenticated using(true);
grant select on public.rivals_video_uploads to authenticated;
create policy "Own video uploads" on public.rivals_video_uploads for select to authenticated using((select auth.uid())=admin_id);
alter publication supabase_realtime add table public.rivals_character_videos;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('rivals-video-uploads','rivals-video-uploads',false,26214400,array['video/mp4']);
-- Signed upload URLs are issued by the authenticated Edge Function, with no browser write policies.
create function public.rivals_finish_video(job uuid,account uuid,url text,seconds double precision) returns void language plpgsql security invoker set search_path='' as $$
declare j public.rivals_video_uploads;
begin
 select * into j from public.rivals_video_uploads where id=job and admin_id=account for update;
 if not found then raise exception 'Unknown upload';end if;
 if j.status='published' then return;end if;
 if j.status<>'github_saved' or j.commit_sha is null then raise exception 'Video is not committed';end if;
 insert into public.rivals_character_videos(character,video_url,video_path,duration,width,height)
 values(j.character,url,j.path,seconds,1920,1080)
 on conflict(character) do update set video_url=excluded.video_url,video_path=excluded.video_path,duration=excluded.duration,width=excluded.width,height=excluded.height,updated_at=now();
 update public.rivals_video_uploads set status='published' where id=job;
end $$;
revoke all on function public.rivals_finish_video(uuid,uuid,text,double precision) from public,anon,authenticated;
grant execute on function public.rivals_finish_video(uuid,uuid,text,double precision) to service_role;
