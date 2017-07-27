#!/bin/bash

set -eu

SOURCE="${BASH_SOURCE[0]}"
TEST_DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
cd $TEST_DIR
echo "Current test dir $(pwd)"

echo "Cleaning out old test results.."
rm -rf $TEST_DIR/results/*

for protocol in $TEST_DIR/Protocols/**/*.py; do
    echo 'Testing: ' $protocol
    GCODE_RES_FILE_NAME=$(echo $protocol | sed 's/\.py$/.gcode/')
    GCODE_RES_FILE_NAME=${GCODE_RES_FILE_NAME#$TEST_DIR}
    GCODE_RES_FILE_PATH=$TEST_DIR/results/$GCODE_RES_FILE_NAME
    GCODE_EXPECTED_FILE_PATH=$TEST_DIR/expected/$GCODE_RES_FILE_NAME

    mkdir -p $(dirname $GCODE_RES_FILE_PATH)

    # echo 'Storing gcode results in: ' $GCODE_RES_FILE_PATH
    APP_DATA_DIR=${TMPDIR:=${TMP:-$(CDPATH=/var:/; cd -P tmp)}}
    rm -rf $APP_DATA_DIR/calibrations/*

    export APP_DATA_DIR=$APP_DATA_DIR
    export LOG_GCODE=true
    # Using Windows Python on Cygwin requires paths be converted
    # check if cygpath exists which means we're runnin on cygwin
    if hash cygpath 2>/dev/null; then
        python $(cygpath -w $protocol) > $GCODE_RES_FILE_PATH
        dos2unix $(cygpath -w $GCODE_RES_FILE_PATH)  # Adjust line endings
    else
        python $protocol > $GCODE_RES_FILE_PATH
    fi


    cmp --silent $GCODE_EXPECTED_FILE_PATH $GCODE_RES_FILE_PATH || { echo '[FAIL] G-Code match false: ' $protocol;  exit 1; }
done
