#!/bin/bash

HOME=/home/vscode
WORKSPACE=/workspace
WORKSPACES=$WORKSPACE/workspaces

for DIR in \
  $HOME/.cache \
  $HOME/.claude \
  $HOME/.local \
  $WORKSPACE/node_modules \
  $WORKSPACES/parser/node_modules; do
  sudo chown -R vscode:vscode $DIR
done
