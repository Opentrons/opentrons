'use strict'

const mime = require('mime')

// TODO(mc, 2019-07-16): optimize cache values
const getCopyParams = obj => ({
  CacheControl: 'public, max-age=86400, no-cache',
  ContentType: mime.getType(obj.Key),
  MetadataDirective: 'REPLACE',
})

/**
 * Copy an object to an S3 bucket
 *
 * @param {S3} s3 - AWS.S3 instance
 * @param {S3Object} sourceObj - Object to copy
 * @param {string} destBucket - Destination bucket
 * @param {string} [destPath] - Destination bucket folder (root if unspecified)
 * @param {boolean} [dryrun] - Do not actually execute the copy
 * @returns {Promise} Promise that resolves when the copy is complete
 *
 * @typedef S3Object
 * @property {string} Bucket - Object bucket
 * @property {String} Prefix - Deploy folder in bucket
 * @property {string} Key - Full key to object
 */
module.exports = function copyObject(
  s3,
  sourceObj,
  destBucket,
  destPath,
  dryrun
) {
  const destPrefix = destPath ? `${destPath}/` : ''
  const destKey = `${destPrefix}${sourceObj.Key.replace(sourceObj.Prefix, '')}`
  const copySource = `/${sourceObj.Bucket}/${sourceObj.Key}`
  const copyParams = getCopyParams(sourceObj)

  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Copy
    Source: ${copySource}
    Dest: /${destBucket}/${destKey}
    Params: ${JSON.stringify(copyParams)}\n`
  )

  if (dryrun) return Promise.resolve()

  const copyObjectParams = Object.assign(
    { Bucket: destBucket, Key: destKey, CopySource: copySource },
    copyParams
  )

  return s3.copyObject(copyObjectParams).promise()
}
