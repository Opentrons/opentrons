'use strict'

const { getDeployMetadataKey } = require('./deploy-metadata')

/*
 * @typedef S3Object
 * @property {string} Bucket
 * @property {String} Prefix - Object path prefix
 * @property {string} Key
 */

// strips any prefix so objects from different folders can be compared
const baseKey = obj => obj.Key.replace(obj.Prefix, '')

/**
 * Diffs two lists to determine which objects from prevObjects to remove
 *
 * @param {S3Object[]} nextObjects - New objects to add to a bucket
 * @param {S3Object[]} prevObjects - Existing objects in that bucket
 * @returns [S3Object] Objects that should be removed from the bucket
 */
module.exports = function getObjectsToRemove(nextObjects, prevObjects) {
  return prevObjects.filter(
    prev =>
      !nextObjects.some(next => baseKey(next) === baseKey(prev)) &&
      baseKey(prev) !== getDeployMetadataKey()
  )
}
