#!/bin/bash

HOME=/home/vscode
WORKSPACE=/workspace

for DIR in \
  $HOME/.cache \
  $HOME/.claude \
  $WORKSPACE/db-dump-data \
  $WORKSPACE/gamestate-json-data \
  $WORKSPACE/node_modules; do
  sudo chown -R vscode:vscode $DIR
done
