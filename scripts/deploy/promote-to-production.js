// script to promote a project's tagged RC build from sandbox to staging
'use strict'

const assert = require('assert')
const AWS = require('aws-sdk')

const parseArgs = require('./lib/parseArgs')
const syncBuckets = require('./lib/syncBuckets')
const { getDeployMetadata } = require('./lib/deploy-metadata')

const USAGE =
  '\nUsage:\n  node ./scripts/deploy/promote-to-production <project_domain> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain] = args
const dryrun = !flags.includes('--deploy')

assert(projectDomain, USAGE)

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-1' })

const stagingBucket = `staging.${projectDomain}`
const productionBucket = projectDomain

getDeployMetadata(s3, stagingBucket)
  .then(deployMetadata => {
    const { current } = deployMetadata
    console.log(
      `Promoting ${projectDomain} ${current} from staging to production\n`
    )

    return syncBuckets(
      s3,
      { bucket: stagingBucket },
      { bucket: productionBucket },
      dryrun
    )
  })
  .then(() => {
    console.log('Promotion to production done\n')
    process.exit(0)
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })
