#!/bin/bash
while true; do
  NODE_OPTIONS="--max-old-space-size=200" node custom-server.js
  echo "Server died, restarting in 2s..." >&2
  sleep 2
done
