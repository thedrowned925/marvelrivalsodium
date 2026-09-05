# Workbook updates

The public site polls the small `data/revision.json` on `main` every 10 seconds
while visible, immediately on refocus/reconnection, and only fetches a full
summary when its revision changes. Hidden/offline tabs stop polling. Open
character details update without clearing filters, page size, or reading position.
The parser publishes revision, summary and all detail files in one Git commit.

## Source-side notification — integration still required

The actual source is a public Drive-hosted XLSX file. A static GitHub Pages page
cannot observe an Excel save event. The existing scheduled Action is a fallback,
not real-time delivery. GitHub schedules have a five-minute minimum and can be
late: https://docs.github.com/actions/using-workflows/events-that-trigger-workflows

`sync-data-v2.yml` accepts `repository_dispatch` with event type
`workbook-updated`. Call `python scripts/notify_workbook_update.py` from the system
that uploads/saves the workbook **after the new Drive revision is downloadable**.
Set `ODIUM_GITHUB_TOKEN` only in that trusted uploader's environment. Use a
fine-grained token scoped to this repository with Contents write permission;
never store it in this repository, frontend, workbook, or logs.

This hook is implemented but is NOT connected to an Excel save event by this
release. GitHub runner queueing and workbook parsing still take time. Do not
advertise zero-delay updates. The final adapter depends on how the source is edited:

- A local Excel/uploader process can invoke the notification after upload.
- A Drive API push integration needs an authenticated, renewable watch channel
  and an HTTPS notification receiver. See
  https://developers.google.com/workspace/drive/api/guides/push
- A native Google Sheet can use an authorized installable edit trigger, but this
  XLSX source must not be silently converted to a different format or file ID.

Only v2 schedules updates. The old workflow remains a manual compatibility link
to v2, preventing two independent writers from racing on the same files.
