#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ZIPNAME="tuk-tracker-demo.zip"
rm -f "$ZIPNAME"
zip -r "$ZIPNAME" demo README.md REPORT.md package.json
echo "Created $ZIPNAME"
