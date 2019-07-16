// sync a source bucket and optional path with a dest bucket and optional path
'use strict'

const assert = require('assert')
const getExistingObjects = require('./getExistingObjects')
const getObjectsToRemove = require('./getObjectsToRemove')
const copyObject = require('./copyObject')
const removeObject = require('./removeObject')

module.exports = function syncBuckets(s3, source, destination, dryrun) {
  const makeCopyTask = obj =>
    copyObject(s3, obj, destination.bucket, destination.path, dryrun)

  const makeRemoveTask = obj => removeObject(s3, obj, dryrun)

  return Promise.all([
    getExistingObjects(s3, source.bucket, source.path),
    getExistingObjects(s3, destination.bucket, destination.path),
  ])
    .then(([nextObjects, prevObjects]) => {
      assert(
        nextObjects.length > 0,
        `No objects found in ${source.bucket}/${source.path}`
      )

      const removals = getObjectsToRemove(nextObjects, prevObjects)

      return Promise.all(nextObjects.map(makeCopyTask)).then(() => {
        console.log('Copies successful; removing old files\n')
        return Promise.all(removals.map(makeRemoveTask))
      })
    })
    .then(() => console.log('Removals successful; sync done\n'))
}
