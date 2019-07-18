'use strict'

/**
 * Remove an object from S3
 *
 * @param {AWS.S3} s3 - AWS.S3 instance
 * @param {S3Object} obj - Object to remove
 * @param {boolean} [dryrun] - Don't actually remove anything
 * @returns {Promise} Promise that resolves when the removal is complete
 *
 * @typedef S3Object
 * @property {string} Bucket - Object bucket
 * @property {String} Prefix - Deploy folder in bucket
 * @property {string} Key - Full key to object
 */
module.exports = function removeObject(s3, obj, dryrun) {
  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Remove
    Source: /${obj.Bucket}/${obj.Key}\n`
  )

  if (dryrun) return Promise.resolve()

  return s3.deleteObject({ Bucket: obj.Bucket, Key: obj.Key }).promise()
}
