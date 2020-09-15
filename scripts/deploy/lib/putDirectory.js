'use strict'

const fs = require('fs').promises
const pathlib = require('path')
const mime = require('mime')

const getPutParams = pathLike => ({
  ACL: 'public-read',
  CacheControl: 'public, max-age=86400, no-cache',
  ContentType: mime.getType(pathLike),
})

/**
 * Put a local directory to an S3 bucket with a specified prefix
 * @param {S3} [s3] - AWS.S3 instance
 * @param {string} [localDir] - Resolvable local path to directory to upload contents of
 * @param {string} [destBucket] - Destination bucket
 * @param {string} [destPrefix] - Prefix to use in the s3 bucket
 * @param {boolean} [dryrun] - Do not actually execute the put
 * returns {Promise} Promise that resolves when the upload is complete
 */
module.exports = function putDirectory(
  s3,
  localDir,
  destBucket,
  destPrefix,
  dryrun
) {
  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Put
      Local Directory: ${localDir}
      Destination: /${destBucket}/${destPrefix}\n`
  )
  const putParams = getPutParams()
  const uploadTree = (entry, path) => {
    if (entry.isDirectory()) {
      return fs
        .readdir(`${path}/${entry.name}`, { withFileTypes: true })
        .then(files =>
          Promise.all(
            files.map(file => uploadTree(file, `${path}/${entry.name}`))
          )
        )
    }
    const relFromTop = pathlib.relative(
      localDir,
      pathlib.join(path, entry.name)
    )
    const destKey = `${destPrefix}/${relFromTop}`
    console.log(`${dryrun ? 'DRYRUN: ' : ''}Putting
        Local File: ${pathlib.join(path, entry.name)}
        Destination: /${destBucket}/${destKey}
    `)
    if (dryrun) {
      return Promise.resolve()
    }
    return fs.readFile(pathlib.join(path, entry.name)).then(data => {
      const putObjectParams = Object.assign(
        {
          Bucket: destBucket,
          Key: destKey,
          Body: data,
        },
        putParams
      )
      return s3
        .putObject(putObjectParams)
        .promise()
        .then(() => {
          console.debug(`Put of ${pathlib.join(path, entry.name)} done`)
        })
    })
  }

  return fs
    .opendir(localDir)
    .then(dirobj => dirobj.read().then(entry => uploadTree(entry, localDir)))
}
