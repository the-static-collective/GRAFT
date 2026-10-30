#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -m unittest discover -s tests -v
if [[ "${1:-}" == "--native-dogram" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "usage: ./run-lab.sh --native-dogram /path/to/PINNED_DOGRAM_CHECKOUT" >&2
    exit 2
  fi
  python3 fairness_lab.py --fixture scenario.json --native-dogram "$2" --output report.json
else
  python3 fairness_lab.py --fixture scenario.json --output report.json
fi
python3 build_dashboard.py
python3 make_review_packet.py report.json held-jarvis-review.json
echo "OPEN: $PWD/index.html (offline). No real resources allocated."
