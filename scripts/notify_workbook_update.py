#!/usr/bin/env python3
"""Call from the workbook uploader AFTER the updated Drive file is available.
This sends an event; it does not itself watch Excel or install a webhook.
"""
import json, os, sys, urllib.error, urllib.request

def notify():
    token=os.environ.get('ODIUM_GITHUB_TOKEN')
    if not token:
        raise RuntimeError('Set ODIUM_GITHUB_TOKEN in the uploader environment (never in site code).')
    body=json.dumps({'event_type':'workbook-updated','client_payload':{'source':'workbook-save'}}).encode()
    req=urllib.request.Request('https://api.github.com/repos/thedrowned925/marvelrivalsodium/dispatches',data=body,method='POST',headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'})
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            if response.status!=204:raise RuntimeError('Unexpected GitHub response')
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'GitHub rejected the update notification (HTTP {e.code}).') from None
    print('Workbook update queued. GitHub processing and download time still apply.')

if __name__=='__main__':
    try:notify()
    except (RuntimeError,urllib.error.URLError) as e:
        print(str(e),file=sys.stderr);sys.exit(1)
