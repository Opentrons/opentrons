'use strict'

const { getDeployMetadataKey } = require('./deploy-metadata')

// strips any prefix so objects from different folders can be compared
const baseKey = obj => obj.Key.replace(obj.Prefix, '')

/**
 * Determines which objects in prevObjects are missing from nextObjects
 *
 * @param {S3Object[]} nextObjects - New objects to add to a bucket
 * @param {S3Object[]} prevObjects - Existing objects in that bucket
 * @returns {S3Object[]} Objects that should be removed from the bucket
 *
 * @typedef S3Object
 * @property {string} Bucket - Object bucket
 * @property {String} Prefix - Deploy folder in bucket
 * @property {string} Key - Full key to object
 */
module.exports = function getObjectsToRemove(nextObjects, prevObjects) {
  return prevObjects.filter(
    prev =>
      !nextObjects.some(next => baseKey(next) === baseKey(prev)) &&
      baseKey(prev) !== getDeployMetadataKey()
  )
}
