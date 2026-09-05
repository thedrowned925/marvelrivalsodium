# ODIUM Stüdyo audio administration

Dedicated project: `odium-rivals-admin` (`iwtwsmkdzzfqshelkvbx`).
The public site and `/admin/` use only the publishable key. Privileged operations
run in the `rivals-audio-admin` Edge Function.

## First owner setup

Open the private one-time setup link provided to the owner. The fragment contains
a random 256-bit code; it is removed from browser history immediately and sent
only in the HTTPS setup request body. Only its SHA-256 hash is stored server-side.
The owner selects username, email and password; no password is stored in Git.
The admin table has a single-owner constraint and accepts no public writes.
There is no public signup form. Supabase Auth accounts without an explicit admin
row have no management permission, including accounts created through Auth APIs.

## GitHub connection

In **Hesap ve GitHub ayarları**, supply a fine-grained GitHub token limited to
`thedrowned925/marvelrivalsodium` with **Contents: Read and write** permission.
The existing ChatGPT GitHub connection cannot be exported to the deployed app.
The server checks repository write permission, then stores the token encrypted
in Supabase Vault. It never returns the token to the browser or public callers.
Revoke/rotate it in GitHub and replace it in the same panel when needed.

## Publication

Choose a character and one or both slots. WAV/MP3/OGG files have a 10 MiB per-file
limit and server-side container signature checks. The owner can preview before
publishing. The server writes immutable audio objects to Storage and Git blobs,
then atomically adds the blobs and managed manifest to a new `main` commit.
A non-forced branch update retries on concurrent workbook commits, preserving
unrelated files. A serialized publish lock prevents overlapping manifest writes.

After GitHub confirms the update, one database transaction publishes the audio
manifest and finishes the job. Supabase Realtime updates open visitor pages;
30-second/focus/reconnect fetching covers missed events. Browser autoplay rules
still require a user gesture. Bundled voice clips stay available as fallback.
GitHub contains the source audio backup; playback uses immutable public Storage
URLs so it does not wait for a GitHub Pages build.

If GitHub's response is uncertain, the job retains its candidate commit. Retry
checks whether that commit reached `main` before publishing the database pointer.
A failed upload does not replace the current published audio. Pending commits
must be reconciled before another upload. Uploads interrupted before any commit
may leave unreferenced immutable objects; they are not exposed by the manifest.

## Authorization and deployment

`verify_jwt=false` is intentional for the one-time setup and username login
routes. Every other route verifies the JWT with Supabase Auth, checks the explicit
single-owner allowlist and checks that its session is still active. User-editable
metadata is never used for authorization. Public roles can only read published
audio. Authenticated owners cannot directly read Vault or write Storage/database
rows; only the Edge Function service role can. No-policy RLS notices on control
and rate-limit tables are intentional deny-all policies for client roles.

The schema is recorded in `schema.sql` and the remote migration history. It
contains no live bootstrap code or GitHub token. Rebuild the pinned browser SDK
with `npm ci --ignore-scripts && npm run build:vendor`, then regenerate script
hashes with `python scripts/version_runtime.py` before publishing.

Actual GitHub publication needs the owner's one-time token configuration. Never
claim that a real audio upload has passed end-to-end until a real token is saved
and a real upload succeeds. Auth/access checks can be run without that token.
