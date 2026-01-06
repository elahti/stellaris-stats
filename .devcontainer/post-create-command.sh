#!/bin/bash

HOME=/home/vscode
WORKSPACE=/workspace

for DIR in \
  $HOME/.cache \
  $HOME/.claude \
  $HOME/.claude.json-volume \
  $HOME/.config/ccstatusline \
  $HOME/.config/gh \
  $HOME/.local/share \
  $HOME/.local/state \
  $WORKSPACE/agent/.venv \
  $WORKSPACE/db-dump-data \
  $WORKSPACE/gamestate-json-data \
  $WORKSPACE/node_modules; do
  sudo chown -R vscode:vscode $DIR
done

ln -sf $HOME/.claude.json-volume/.claude.json $HOME/.claude.json

curl -fsSL https://claude.ai/install.sh | bash
