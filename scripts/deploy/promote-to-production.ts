// script to promote a project's tagged RC build from sandbox to staging
'use strict'

import { S3 } from '@aws-sdk/client-s3'
import { fromIni } from '@aws-sdk/credential-provider-ini'
import { promptUser } from './prompt-user.js'
import { getDeployMetadata } from './lib/deploy-metadata'
import { getAssumeRole } from './assume-role'
import { getCreateInvalidation } from './create-invalidation'
import { checkCurrentAWSProfile } from './check-current-profile'
import parseArgs from './lib/parseArgs'
import syncBuckets from './lib/syncBuckets'

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
  '\nUsage:\n  ts-node ./scripts/deploy/promote-to-production <project_domain> [--deploy]'

const { args, flags } = parseArgs(process.argv.slice(2))
const [projectDomain] = args
const dryrun = !flags.includes('--deploy')

let cloudfrontArn: string = PROD_LL_CLOUDFRONT_ARN
if (projectDomain === PROTOCOL_DESIGNER_DOMAIN) {
  cloudfrontArn = PROD_PD_CLOUDFRONT_ARN
} else if (projectDomain === DOCS_DOMAIN) {
  cloudfrontArn = PROD_DOCS_CLOUDFRONT_ARN
}

const ROLE_ARN =
  projectDomain === PROTOCOL_DESIGNER_DOMAIN
    ? ADMINISTRATOR_ROLE_ARN
    : ROBOTICS_STATIC_WEBSITE_ROLE_ARN

console.assert(projectDomain, USAGE)

async function runPromoteToProduction() {
  try {
    const AWS_PROFILE = await checkCurrentAWSProfile()
    const confirmation = await promptUser('Is the AWS profile correct?')

    if (!confirmation) {
      console.log(
        `Exiting script. Please configure the correct AWS profile through the ${AWS_PROFILE} environment and run the script again.`
      )
      return
    }

    const credentials = await fromIni({ profile: 'default' })()

    const assumeRoleCredentials = await getAssumeRole(
      ROLE_ARN,
      'promoteToProduction'
    )
    const productionCredentials =
      assumeRoleCredentials != null
        ? {
            accessKeyId: assumeRoleCredentials.AccessKeyId,
            secretAccessKey: assumeRoleCredentials.SecretAccessKey,
            sessionToken: assumeRoleCredentials.SessionToken,
          }
        : { accessKeyId: '', secretAccessKey: '', sessionToken: '' }

    console.log('credentials', credentials)
    const s3 = new S3({ region: 'us-east-1', credentials: credentials })

    const stagingBucket = `staging.${projectDomain}`
    const productionBucket = projectDomain

    const deployMetadata = await getDeployMetadata(s3, stagingBucket)
    const { current } = deployMetadata
    console.log(
      `Promoting ${projectDomain} ${current} from staging to production\n`
    )

    await syncBuckets(
      s3,
      { bucket: stagingBucket },
      { bucket: productionBucket },
      dryrun
    )
    console.log('Promotion to production done\n')

    await getCreateInvalidation(productionCredentials, cloudfrontArn)
    console.log('Cache invalidation initiated for production\n')

    return
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

runPromoteToProduction()
