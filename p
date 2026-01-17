#!/bin/bash
git add .
git commit -m "Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
git push
