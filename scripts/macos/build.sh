#!/bin/bash

set -e

cd "$(dirname "$0")/../.."

PROJECT_NAME="eFlow"
PYLIB_DIR="$(realpath src-tauri/pyembed/python/lib)"

export PYTAURI_STANDALONE="1"
export PYO3_PYTHON="$(realpath src-tauri/pyembed/python/bin/python3)"
export RUSTFLAGS=" \
    -C link-arg=-Wl,-rpath,@executable_path/../Resources/lib \
    -L \"$PYLIB_DIR\""

uv pip install \
    --exact \
    --compile-bytecode \
    --python="$PYO3_PYTHON" \
    --reinstall-package="$PROJECT_NAME" \
    ./src-tauri

pnpm tauri build --config="src-tauri/tauri.bundle.json" -- --profile bundle-release
