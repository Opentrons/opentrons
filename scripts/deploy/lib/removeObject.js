// remove an object from a bucket
'use strict'

module.exports = function removeObject(s3, obj, dryrun) {
  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Remove
    Source: /${obj.Bucket}/${obj.Key}\n`
  )

  if (dryrun) return Promise.resolve()

  return s3.deleteObject({ Bucket: obj.Bucket, Key: obj.Key }).promise()
}
