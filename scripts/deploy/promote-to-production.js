// script to promote a project's tagged RC build from sandbox to staging
'use strict'

const assert = require('assert')
const { S3Client } = require('@aws-sdk/client-s3')

const parseArgs = require('./lib/parseArgs')
const syncBuckets = require('./lib/syncBuckets')
const { getAssumeRole } = require('./assume-role')
const { getCreateInvalidation } = require('./create-invalidation')
const { checkCurrentAWSProfile } = require('./check-current-profile')
const { promptUser } = require('./prompt-user')

const PROTOCOL_DESIGNER_DOMAIN = 'designer.opentrons.com'
const DOCS_DOMAIN = 'docs.opentrons.com'

const ADMINISTRATOR_ROLE_ARN = 'arn:aws:iam::043748923082:role/administrator'
const ROBOTICS_STATIC_WEBSITE_ROLE_ARN =
  'arn:aws:iam::480034758691:role/robotics-static-website-deployer-root'
const PROD_DOCS_CLOUDFRONT_ARN =
  'arn:aws:cloudfront::480034758691:distribution/E16BZZXDTINN0S'
const PROD_LL_CLOUDFRONT_ARN =
  'arn:aws:cloudfront::480034758691:distribution/E3B7DCQCQCYUDJ'
const PROD_PD_CLOUDFRONT_ARN = `arn:aws:cloudfront::043748923082:distribution/E20OHY6J3BRVIF`

const USAGE =
  '\nUsage:\n  node ./scripts/deploy/promote-to-production <project_domain> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain] = args
const dryrun = !flags.includes('--deploy')

let cloudfrontArn
if (projectDomain === PROTOCOL_DESIGNER_DOMAIN) {
  cloudfrontArn = PROD_PD_CLOUDFRONT_ARN
} else if (projectDomain === DOCS_DOMAIN) {
  cloudfrontArn = PROD_DOCS_CLOUDFRONT_ARN
} else {
  cloudfrontArn = PROD_LL_CLOUDFRONT_ARN
}
const ROLE_ARN =
  projectDomain === PROTOCOL_DESIGNER_DOMAIN
    ? ADMINISTRATOR_ROLE_ARN
    : ROBOTICS_STATIC_WEBSITE_ROLE_ARN

assert(projectDomain, USAGE)

async function runPromoteToProduction() {
  try {
    const AWS_PROFILE = await checkCurrentAWSProfile()
    const confirmation = await promptUser('Is the AWS profile correct?')

    if (!confirmation) {
      console.log(
        `Exiting script. Please configure the correct AWS profile through the ${AWS_PROFILE} environment and run the script again.`
      )
      process.exit(0)
    }

    const credentials = await getAssumeRole(ROLE_ARN, 'promoteToProduction')
    const productionCredentials = {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    }
    const s3Client = new S3Client({
      apiVersion: '2006-03-01',
      region:
        projectDomain === PROTOCOL_DESIGNER_DOMAIN ? 'us-east-1' : 'us-east-2',
      credentials: productionCredentials,
    })

    const stagingBucket = `staging.${projectDomain}`
    const productionBucket = projectDomain
    console.log(`Promoting ${projectDomain} from staging to production\n`)
    await syncBuckets(
      s3Client,
      { bucket: stagingBucket },
      { bucket: productionBucket },
      dryrun
    )
    console.log('Promotion to production done\n')

    await getCreateInvalidation(productionCredentials, cloudfrontArn, dryrun)
    console.log(
      `${dryrun ? 'DRYRUN: ' : ''}Cache invalidation initiated for production\n`
    )
    process.exit(0)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

runPromoteToProduction()
