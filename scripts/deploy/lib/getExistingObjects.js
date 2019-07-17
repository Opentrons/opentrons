'use strict'

/**
 * Get the list of objects in a bucket
 *
 * @param {S3} s3 - AWS.S3 instance
 * @param {string} bucket - Bucket name
 * @param {string} [path] - Bucket folder (root if not specified)
 * @returns {Promise<S3Object[]>} Promise that resolves to a list of objects in the bucket
 *
 * @typedef S3Object
 * @property {string} Bucket - Bucket name
 * @property {String} Prefix - Object path prefix
 * @property {string} Key - Object path key
 */
module.exports = function getExistingObjects(s3, bucket, path) {
  const prefix = path ? `${path}/` : ''

  return s3
    .listObjectsV2({ Bucket: bucket, Prefix: prefix })
    .promise()
    .then(response =>
      response.Contents.map(obj => ({
        Bucket: bucket,
        Prefix: prefix,
        Key: obj.Key,
      }))
    )
}
