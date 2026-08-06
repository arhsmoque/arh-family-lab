#!/usr/bin/env bash
set -euo pipefail
APP_ID="${1:-}"
PLATFORMS="${2:-android,ios}"
if [[ -z "$APP_ID" || "$APP_ID" == *placeholder* || "$APP_ID" == com.example.* ]]; then
  echo "Usage: $0 <final.reverse.domain.appid> [android,ios|android|ios]" >&2
  exit 2
fi
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$REPO_ROOT/apps/family-hub/mobile"
python3 - "$MOBILE/capacitor.config.json" "$APP_ID" <<'PY2'
import json, sys
p, app_id = sys.argv[1:]
data = json.load(open(p, encoding='utf-8'))
data['appId'] = app_id
json.dump(data, open(p, 'w', encoding='utf-8'), indent=2)
open(p, 'a').write('\n')
PY2
cd "$MOBILE"
npm install
npm run build:web
npm run validate
[[ "$PLATFORMS" == *android* ]] && npm run native:add:android
[[ "$PLATFORMS" == *ios* ]] && npm run native:add:ios
npm run native:sync
