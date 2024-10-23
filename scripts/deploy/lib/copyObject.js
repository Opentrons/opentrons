'use strict'

const mime = require('mime')
const { CopyObjectCommand } = require('@aws-sdk/client-s3')

// TODO(mc, 2019-07-16): optimize cache values
const getCopyParams = obj => ({
  CacheControl: 'public, max-age=86400, no-cache',
  ContentType: mime.getType(obj.Key),
  MetadataDirective: 'REPLACE',
})

/**
 * Copy an object to an S3 bucket
 *
 * @param {S3Client} s3 - AWS SDK v3 S3Client instance
 * @param {S3Object} sourceObj - Object to copy
 * @param {string} destBucket - Destination bucket
 * @param {string} [destPath] - Destination bucket folder (root if unspecified)
 * @param {boolean} [dryrun] - Do not actually execute the copy
 * @returns {Promise} Promise that resolves when the copy is complete
 *
 * @typedef S3Object
 * @property {string} Bucket - Object bucket
 * @property {string} Prefix - Deploy folder in bucket
 * @property {string} Key - Full key to object
 */
module.exports = async function copyObject(
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
    `${
      dryrun ? 'DRYRUN: ' : ''
    }Copy\nSource: ${copySource}\nDest: /${destBucket}/${destKey}\nParams: ${JSON.stringify(
      copyParams
    )}\n`
  )

  if (dryrun) return Promise.resolve()

  const copyObjectParams = {
    Bucket: destBucket,
    Key: destKey,
    CopySource: copySource,
    ...copyParams,
  }

  try {
    const command = new CopyObjectCommand(copyObjectParams)
    await s3.send(command)
    console.log(`Successfully copied to /${destBucket}/${destKey}`)
  } catch (err) {
    console.error(`Error copying object: ${err.message}`)
    throw err
  }
}
