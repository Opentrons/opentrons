'use strict'

const assert = require('assert')
const getExistingObjects = require('./getExistingObjects')
const getObjectsToRemove = require('./getObjectsToRemove')
const copyObject = require('./copyObject')
const removeObject = require('./removeObject')
/**
 * Sync a source bucket to a destination bucket. Copies objects from source
 * and deletes any objects in destination that don't exist in source
 *
 * @param {AWS.S3} s3 - AWS.S3 instance
 * @param {{bucket: string, path?: string}} source - Source bucket and optional path
 * @param {{bucket: string, path?: string}} destination - Destination bucket and optional path
 * @param {boolean} [dryrun] - Don't actually copy or remove anything
 * @returns {Promise} A promise that resolves when the sync is done
 */
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
