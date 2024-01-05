// script to promote a project's tagged RC build from sandbox to staging
'use strict'

const assert = require('assert')
const AWS = require('aws-sdk')

const parseArgs = require('./lib/parseArgs')
const syncBuckets = require('./lib/syncBuckets')
const { getDeployMetadata } = require('./lib/deploy-metadata')
const { getAssumeRole } = require('./assume-role')
const { getCreateInvalidation } = require('./create-invalidation')

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

assert(projectDomain, USAGE)

getAssumeRole(
  PROTOCOL_DESIGNER_DOMAIN
    ? ADMINISTRATOR_ROLE_ARN
    : ROBOTICS_STATIC_WEBSITE_ROLE_ARN,
  'promoteToProduction'
)
  .then(credentials => {
    const productionCredentials = new AWS.Credentials({
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    })

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: 'us-east-1',
      credentials: productionCredentials,
    })

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
        getCreateInvalidation(productionCredentials, cloudfrontArn)
      })
      .then(() => {
        console.log('Cache invalidation initiated for production\n')
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
