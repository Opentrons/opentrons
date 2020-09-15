'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const putDirectory = require('../../../../scripts/deploy/lib/putDirectory')
const AWS = require('aws-sdk')
const projects = {
  ['docs.opentrons.com']: '/api/docs/dist',
}

const run = () => {
  const domain = core.getInput('domain', { required: true })
  const context = github.context
  const localDir = projects[project]
  const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-2' })
  const sandboxBucket = `sandbox.${domain}`
  core.info(`Deploying ${localDir} to ${sandboxBucket}`)
  return putDirectory(s3, localDir, sandboxBucket, context.ref, false)
}

run()
  .resolve()
  .catch(err => {
    github.setFailed(err)
  })
