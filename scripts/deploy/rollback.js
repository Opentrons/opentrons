// roll an environment back to its previous deploy
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
  '\nUsage:\n  node ./scripts/deploy/rollback <project_domain> <environment> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain, environment] = args
const dryrun = !flags.includes('--deploy')

assert(
  projectDomain && (environment === 'staging' || environment === 'production'),
  USAGE
)

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-2' })

const sandboxBucket = `sandbox.${projectDomain}`
const rollbackBucket =
  environment === 'production' ? projectDomain : `staging.${projectDomain}`

getDeployMetadata(s3, rollbackBucket)
  .then(deployMetadata => {
    const { previous } = deployMetadata

    console.log(`${rollbackBucket} deploy metadata: %j`, deployMetadata)
    assert(
      previous,
      'Unable to find previous deploy tag; was this environment already rolled back?'
    )

    return syncBuckets(
      s3,
      { bucket: sandboxBucket, path: previous },
      { bucket: rollbackBucket },
      dryrun
    )
      .then(() =>
        setDeployMetadata(
          s3,
          rollbackBucket,
          '',
          { previous: null, current: previous || null },
          dryrun
        )
      )
      .then(() => {
        console.log(`Rollback of ${rollbackBucket} to ${previous} done\n`)
      })
  })
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })
