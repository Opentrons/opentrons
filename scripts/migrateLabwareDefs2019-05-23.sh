# !/bin/bash
# Invoke this with like `./migrateLabwareDefs2019-05-23.sh path/to/shared-data`

for filepath in $(ls $1/definitions2/*.json)
do
  echo $filepath
  filebasename=$(basename $filepath .json)
  echo $filebasename
  # assumes only version is 1
  dirpath=$1/labware/definitions/2/$filebasename/1
  echo $dirpath
  mkdir -p $dirpath
  cp $filepath $dirpath/$filebasename.json
done
