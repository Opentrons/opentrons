// script to promote a project's tagged RC build from sandbox to staging
'use strict'

const assert = require('assert')
const AWS = require('aws-sdk')

const parseArgs = require('./lib/parseArgs')
const syncBuckets = require('./lib/syncBuckets')
const {
  getDeployMetadata,
  setDeployMetadata,
} = require('./lib/deploy-metadata')

const USAGE =
  '\nUsage:\n  node ./scripts/deploy/promote-to-staging <project_domain> <tag> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain, tag] = args
const dryrun = !flags.includes('--deploy')

assert(projectDomain && tag, USAGE)

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-1' })

const sandboxBucket = `sandbox.${projectDomain}`
const stagingBucket = `staging.${projectDomain}`

getDeployMetadata(s3, stagingBucket)
  .then(prevDeployMetadata => {
    console.log('Previous deploy metadata: %j', prevDeployMetadata)

    return syncBuckets(
      s3,
      { bucket: sandboxBucket, path: tag },
      { bucket: stagingBucket },
      dryrun
    ).then(() =>
      setDeployMetadata(
        s3,
        stagingBucket,
        '',
        { previous: prevDeployMetadata.current || null, current: tag },
        dryrun
      )
    )
  })
  .then(() => {
    console.log('Promotion to staging done\n')
    process.exit(0)
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })
