'use strict'

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3')

const DEPLOY_METADATA_KEY = '.deploy.json'

const getDeployMetadataKey = path =>
  `${path ? `${path}/` : ''}${DEPLOY_METADATA_KEY}`

/**
 * Get the deploy metadata of an environment
 *
 * @param {S3Client} s3Client - AWS S3Client instance
 * @param {string} bucket - Bucket name
 * @param {string} [path] - Bucket folder (root if unspecified)
 * @returns {Promise<{current: string | null, previous: string | null}>} Promise that resolved with deploy metadata
 */
async function getDeployMetadata(s3Client, bucket, path) {
  try {
    const data = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: getDeployMetadataKey(path),
      })
    )
    return data.Body ? JSON.parse(data.Body) : {}
  } catch (error) {
    console.warn(`Error retrieving deploy metadata: ${error.message}`)
    return {}
  }
}
/**
 * Set the deploy metadata of an environment
 *
 * @param {S3Client} s3Client - AWS S3Client instance
 * @param {string} bucket - Bucket name
 * @param {string} [path] - Bucket folder (root if unspecified)
 * @param {{current: string | null, previous: string | null}} metadata - Deploy metadata
 * @param {boolean} [dryrun] - Do not actually update the deploy metadata file
 * @returns {Promise} Promise that resolves when the file has been updated
 */
async function setDeployMetadata(s3Client, bucket, path, metadata, dryrun) {
  const key = getDeployMetadataKey(path)

  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Set deploy metadata:
    Path: /${bucket}/${key}
    Contents: %j\n`,
    metadata
  )

  if (dryrun) return Promise.resolve()

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(metadata),
        CacheControl: 'no-store',
        ContentType: 'application/json',
      })
    )
  } catch (error) {
    throw new Error(`Error setting deploy metadata: ${error.message}`)
  }
}

module.exports = { getDeployMetadata, setDeployMetadata, getDeployMetadataKey }
