// copy an object from one bucket to another
'use strict'

const mime = require('mime')

// TODO(mc, 2019-07-16): optimize cache values
const getCopyParams = obj => ({
  ACL: 'public-read',
  CacheControl: 'public, max-age=86400, no-cache',
  ContentType: mime.getType(obj.Key),
  MetadataDirective: 'REPLACE',
})

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
