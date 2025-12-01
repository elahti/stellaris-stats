#!/bin/bash

HOME=/home/vscode
WORKSPACE=/workspace

for DIR in \
  $HOME/.cache \
  $HOME/.claude \
  $HOME/.local \
  $WORKSPACE/db-dump-data \
  $WORKSPACE/gamestate-json-data \
  $WORKSPACE/node_modules; do
  sudo chown -R vscode:vscode $DIR
done
