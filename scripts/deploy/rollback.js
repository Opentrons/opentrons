// roll an environment back to its previous deploy
'use strict'

const assert = require('assert')
const { S3Client } = require('@aws-sdk/client-s3')

const { getAssumeRole } = require('./assume-role')
const { checkCurrentAWSProfile } = require('./check-current-profile')
const { promptUser } = require('./prompt-user')
const parseArgs = require('./lib/parseArgs')
const syncBuckets = require('./lib/syncBuckets')
const {
  getDeployMetadata,
  setDeployMetadata,
} = require('./lib/deploy-metadata')

const PROTOCOL_DESIGNER_DOMAIN = 'designer.opentrons.com'
const ADMINISTRATOR_ROLE_ARN = 'arn:aws:iam::043748923082:role/administrator'
const ROBOTICS_STATIC_WEBSITE_ROLE_ARN =
  'arn:aws:iam::480034758691:role/robotics-static-website-deployer-root'
const USAGE =
  '\nUsage:\n  node ./scripts/deploy/rollback <project_domain> <environment> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain, environment] = args

const dryrun = !flags.includes('--deploy')

assert(
  projectDomain && (environment === 'staging' || environment === 'production'),
  USAGE
)

async function performRollback(
  s3Client,
  sandboxBucket,
  rollbackBucket,
  dryrun
) {
  try {
    const deployMetadata = await getDeployMetadata(s3Client, rollbackBucket)
    const { previous } = deployMetadata
    console.log(`${rollbackBucket} deploy metadata: %j`, deployMetadata)
    assert(
      previous,
      'Unable to find previous deploy tag; was this environment already rolled back?'
    )

    await syncBuckets(
      s3Client,
      { bucket: sandboxBucket, path: previous },
      { bucket: rollbackBucket },
      dryrun
    )

    await setDeployMetadata(
      s3Client,
      rollbackBucket,
      '',
      { previous: null, current: previous || null },
      dryrun
    )

    console.log(`Rollback of ${rollbackBucket} to ${previous} done\n`)
    process.exit(0)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

async function runRollback() {
  try {
    const AWS_PROFILE = await checkCurrentAWSProfile()

    const confirmation = await promptUser('Is the AWS profile correct?')

    if (!confirmation) {
      console.log(
        `Exiting script. Please configure the correct AWS profile through the ${AWS_PROFILE} environment and run the script again.`
      )
      process.exit(0)
    }

    const credentials = await getAssumeRole(
      projectDomain === PROTOCOL_DESIGNER_DOMAIN
        ? ADMINISTRATOR_ROLE_ARN
        : ROBOTICS_STATIC_WEBSITE_ROLE_ARN,
      'rollBack'
    )

    const rollBackCredentials = {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    }

    const s3Client = new S3Client({
      apiVersion: '2006-03-01',
      region:
        projectDomain === PROTOCOL_DESIGNER_DOMAIN ? 'us-east-1' : 'us-east-2',
      credentials: rollBackCredentials,
    })

    const sandboxBucket = `sandbox.${projectDomain}`
    const rollbackBucket =
      environment === 'production' ? projectDomain : `staging.${projectDomain}`
    return performRollback(s3Client, sandboxBucket, rollbackBucket, dryrun)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
runRollback()
