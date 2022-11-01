#!/bin/sh

GIT_HASH=$(git rev-parse --short=8 HEAD)
TEMP_DIR_NAME="./ot3-firmware-$GIT_HASH"

REPO_DIR=$1
echo "Copying images from repository at $REPO_DIR"

THIS_DIR=$(pwd -P)
echo "The absolute path is: $THIS_DIR"

FW_PATH_GANTRY_X="$REPO_DIR/build-cross/gantry/firmware/gantry-x-rev1.hex"
FW_PATH_GANTRY_Y="$REPO_DIR/build-cross/gantry/firmware/gantry-y-rev1.hex"
FW_PATH_HEAD="$REPO_DIR/build-cross/head/firmware/head-proto.hex"
FW_PATH_PIPETTES_SINGLE="$REPO_DIR/build-cross/pipettes/firmware/pipettes-single-rev1.hex"
FW_PATH_PIPETTES_MULTI="$REPO_DIR/build-cross/pipettes/firmware/pipettes-multi-rev1.hex"

# build all the firmware
cd "$REPO_DIR" || cd "$THIS_DIR" || exit
cmake --preset=cross .
cmake --build --preset=gantry-x --target=gantry-x-rev1-flash || true
cmake --build --preset=gantry-y --target=gantry-y-rev1-flash || true
cmake --build --preset=head --target=head-flash || true
cmake --build --preset=pipettes-rev1 --target=pipettes-single-rev1-flash || true
cmake --build --preset=pipettes-rev1 --target=pipettes-multi-rev1-flash || true
cd "$THIS_DIR" || exit

# move all HEX files to temporary folder
rm -rf "$TEMP_DIR_NAME" || exit
mkdir "$TEMP_DIR_NAME"
cp "$FW_PATH_GANTRY_X" "$TEMP_DIR_NAME/gantry-x-rev1.hex"
cp "$FW_PATH_GANTRY_Y" "$TEMP_DIR_NAME/gantry-y-rev1.hex"
cp "$FW_PATH_HEAD" "$TEMP_DIR_NAME/head-proto.hex"
cp "$FW_PATH_PIPETTES_SINGLE" "$TEMP_DIR_NAME/pipettes-single-rev1.hex"
cp "$FW_PATH_PIPETTES_MULTI" "$TEMP_DIR_NAME/pipettes-multi-rev1.hex"

# compress folder, then delete
tar -czvf "$TEMP_DIR_NAME.tar.gz" "$TEMP_DIR_NAME"
rm -rf "$TEMP_DIR_NAME"
echo done.