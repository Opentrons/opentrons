/**
 * Temporary script until electron-builder#1582 is resolved (https://github.com/electron-userland/electron-builder/issues/1582).
 */
import * as path from 'path'
import { S3 } from 'aws-sdk'
import { readFileSync } from 'fs'

const BUCKET = 'ot-app-builds'
const KEY = `channels/${channel}/${channel}.yml`
const LATEST_YML_PATH = path.resolve(__dirname, '../dist/latest.yml')

const s3Options = {
  signatureVersion: 'v4'
}

const putOptions = {
  Bucket: BUCKET,
  Key: KEY,
  ACL: 'public-read',
  Body: readFileSync(LATEST_YML_PATH)
}

const s3 = new S3(s3Options)

function callback (err, data) {
  if (err) {
    console.error('Error occurred while trying to publish latest.yml\n', err)
  } else {
    console.log(data)
    console.info(`Successfully published latest.yml to ${BUCKET}`)
  }
}

s3.putObject(putOptions, callback)
