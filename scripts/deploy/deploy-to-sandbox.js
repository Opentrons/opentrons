// script to put a project in its assigned sandbox dir
'use strict'

const assert = require('assert')
const AWS = require('aws-sdk')

const parseArgs = require('./lib/parseArgs')
const putDirectory = require('./lib/putDirectory')

const USAGE =
  '\nUsage:\n  node ./scripts/deploy/deploy-to-sandbox <project_domain> <sandbox_subdir> <artifact_path> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain, sandboxDir, artifactPath] = args
const dryrun = !flags.includes('--deploy')

assert(projectDomain && sandboxDir && artifactPath, USAGE)

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-2' })

const sandboxBucket = `sandbox.${projectDomain}`

putDirectory(s3, artifactPath, sandboxBucket, sandboxDir, dryrun)
  .then(() => {
    console.log('Deploy to sandbox done\n')
    process.exit(0)
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })
