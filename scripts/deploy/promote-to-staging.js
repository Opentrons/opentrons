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
const { getAssumeRole } = require('./assume-role')
const { getCreateInvalidation } = require('./create-invalidation')
const { checkCurrentAWSProfile } = require('./check-current-profile')
const { promptUser } = require('./prompt-user')

const PROTOCOL_DESIGNER_DOMAIN = 'designer.opentrons.com'
const DOCS_DOMAIN = 'docs.opentrons.com'

const ADMINISTRATOR_ROLE_ARN = 'arn:aws:iam::043748923082:role/administrator'
const ROBOTICS_STATIC_WEBSITE_ROLE_ARN =
  'arn:aws:iam::480034758691:role/robotics-static-website-deployer-root'
const STAGING_DOCS_CLOUDFRONT_ARN =
  'arn:aws:cloudfront::480034758691:distribution/E8IWASMDOWHYP'
const STAGING_LL_CLOUDFRONT_ARN =
  'arn:aws:cloudfront::480034758691:distribution/E1IPE9BNVE8OGU'
const STAGING_PD_CLOUDFRONT_ARN =
  'arn:aws:cloudfront::043748923082:distribution/EB2QTLE7OJ8O6'

const USAGE =
  '\nUsage:\n  node ./scripts/deploy/promote-to-staging <project_domain> <tag> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain, tag] = args
const dryrun = !flags.includes('--deploy')

assert(projectDomain && tag, USAGE)

const sandboxBucket = `sandbox.${projectDomain}`
const stagingBucket = `staging.${projectDomain}`

let cloudfrontArn
if (projectDomain === PROTOCOL_DESIGNER_DOMAIN) {
  cloudfrontArn = STAGING_PD_CLOUDFRONT_ARN
} else if (projectDomain === DOCS_DOMAIN) {
  cloudfrontArn = STAGING_DOCS_CLOUDFRONT_ARN
} else {
  cloudfrontArn = STAGING_LL_CLOUDFRONT_ARN
}
const ROLE_ARN =
  projectDomain === PROTOCOL_DESIGNER_DOMAIN
    ? ADMINISTRATOR_ROLE_ARN
    : ROBOTICS_STATIC_WEBSITE_ROLE_ARN

async function runPromoteToStaging() {
  try {
    await checkCurrentAWSProfile()

    // Prompt the user for confirmation
    const confirmation = await promptUser('Is the AWS profile correct?')

    if (!confirmation) {
      console.log(
        'Exiting script. Please configure the correct AWS profile and run the script again.'
      )
      process.exit(0)
    }

    // Proceed with assuming the role and other operations
    await getAssumeRole(ROLE_ARN, 'promoteToStaging')
      .then(credentials => {
        const stagingCredentials = new AWS.Credentials({
          accessKeyId: credentials.AccessKeyId,
          secretAccessKey: credentials.SecretAccessKey,
          sessionToken: credentials.SessionToken,
        })

        const s3WithCreds = new AWS.S3({
          apiVersion: '2006-03-01',
          region: 'us-east-1',
          credentials: stagingCredentials,
        })

        getDeployMetadata(s3WithCreds, stagingBucket)
          .then(prevDeployMetadata => {
            console.log('Previous deploy metadata: %j', prevDeployMetadata)
            return syncBuckets(
              s3WithCreds,
              { bucket: sandboxBucket, path: tag },
              { bucket: stagingBucket },
              dryrun
            ).then(() =>
              setDeployMetadata(
                s3WithCreds,
                stagingBucket,
                '',
                { previous: prevDeployMetadata.current || null, current: tag },
                dryrun
              )
            )
          })
          .then(() => {
            console.log('Promotion to staging done\n')
            getCreateInvalidation(stagingCredentials, cloudfrontArn)
          })
          .then(() => {
            console.log('Cache invalidation initiated for staging\n')
            process.exit(0)
          })
          .catch(error => {
            console.error(error.message)
            process.exit(1)
          })
      })
      .catch(err => {
        console.error(err)
      })
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

runPromoteToStaging()
