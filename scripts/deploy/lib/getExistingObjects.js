'use strict'

const { ListObjectsV2Command } = require('@aws-sdk/client-s3')

/**
 * Get the list of objects in a bucket
 *
 * @param {S3} s3Client - AWS S3Client instance
 * @param {string} bucket - Bucket name
 * @param {string} [path] - Bucket folder (root if not specified)
 * @returns {Promise<S3Object[]>} Promise that resolves to a list of objects in the bucket
 *
 * @typedef S3Object
 * @property {string} Bucket - Bucket name
 * @property {String} Prefix - Object path prefix
 * @property {string} Key - Object path key
 */
module.exports = async function getExistingObjects(s3Client, bucket, path) {
  const prefix = path ? `${path}/` : ''

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  })

  try {
    const response = await s3Client.send(command)
    return response.Contents.map(obj => ({
      Bucket: bucket,
      Prefix: prefix,
      Key: obj.Key,
    }))
  } catch (error) {
    console.error(`Error listing objects: ${error.message}`)
    return []
  }
}
