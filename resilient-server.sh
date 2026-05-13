#!/bin/bash
while true; do
  NODE_OPTIONS="--max-old-space-size=200" npx next start -p 3000 -H 0.0.0.0
  sleep 3
done
