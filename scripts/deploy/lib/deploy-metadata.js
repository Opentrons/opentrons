'use strict'

const DEPLOY_METADATA_KEY = '.deploy.json'

const getDeployMetadataKey = path =>
  `${path ? `${path}/` : ''}${DEPLOY_METADATA_KEY}`

/**
 * Get the deploy metadata of an environment
 *
 * @param {S3} s3 - AWS.S3 instance
 * @param {string} bucket - Bucket name
 * @param {string} [path] - Bucket folder (root if unspecified)
 * @returns {Promise<{current: string | null, previous: string | null}>} Promise that resolved with deploy metadata
 */
function getDeployMetadata(s3, bucket, path) {
  return s3
    .getObject({ Bucket: bucket, Key: getDeployMetadataKey(path) })
    .promise()
    .then(data => (data.Body ? JSON.parse(data.Body) : {}))
    .catch(error => {
      console.warn(`Error retrieving deploy metadata: ${error.message}`)
      return {}
    })
}

/**
 * Set the deploy metadata of an environment
 *
 * @param {S3} s3 - AWS.S3 instance
 * @param {string} bucket - Bucket name
 * @param {string} [path] - Bucket folder (root if unspecified)
 * @param {{current: string | null, previous: string | null}} metadata - Deploy metadata
 * @param {boolean} [dryrun] - Do not actually update the deploy metadata file
 * @returns {Promise} Promise that resolves when the file has been updated
 */
function setDeployMetadata(s3, bucket, path, metadata, dryrun) {
  const key = getDeployMetadataKey(path)

  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Set deploy metadata:
    Path: /${bucket}/${key}
    Contents: %j\n`,
    metadata
  )

  if (dryrun) return Promise.resolve()

  return s3
    .putObject({
      Bucket: bucket,
      Key: getDeployMetadataKey(path),
      Body: JSON.stringify(metadata),
      CacheControl: 'no-store',
      ContentType: 'application/json',
    })
    .promise()
}

module.exports = { getDeployMetadata, setDeployMetadata, getDeployMetadataKey }
