#!/bin/bash

HOME=/home/vscode
WORKSPACE=/workspace
WORKSPACES=$WORKSPACE/workspaces

for DIR in \
  $HOME/.cache \
  $HOME/.claude \
  $HOME/.local \
  $WORKSPACE/gamestate-json-data \
  $WORKSPACE/node_modules \
  $WORKSPACES/graphql-server/node_modules \
  $WORKSPACES/scripts/node_modules \
  $WORKSPACES/shared/node_modules; do
  sudo chown -R vscode:vscode $DIR
done
