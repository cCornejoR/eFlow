#!/bin/bash

### Argument ###

PYTHON_VERSION="3.13.3"  # update these by yourself
TAG="20250409"  # update these by yourself
TARGET="x86_64-unknown-linux-gnu"

################

set -e

cd "$(dirname "$0")/../.."

url="https://github.com/astral-sh/python-build-standalone/releases/download/${TAG}/cpython-${PYTHON_VERSION}+${TAG}-${TARGET}-install_only_stripped.tar.gz"

DEST_DIR="src-tauri/pyembed"
mkdir "$DEST_DIR"
curl -L "$url" | tar -xz -C "$DEST_DIR"
