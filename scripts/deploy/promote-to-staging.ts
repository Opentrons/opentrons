// // script to promote a project's tagged RC build from sandbox to staging
// 'use strict'

const { getAssumeRole } = require('./assume-role.ts')
;(async () => {
  const { S3 } = (await import('@aws-sdk/client-s3')).default
  const { promptUser } = (await import('./prompt-user.js')).default
  const getDeployMetadata = (await import('./lib/deploy-metadata.js'))
    .getDeployMetadata
  // const getAssumeRole = (await import('./assume-role')).getAssumeRole
  const { getCreateInvalidation } = await import('./create-invalidation')
  const { checkCurrentAWSProfile } = await import('./check-current-profile')
  const parseArgs = (await import('./lib/parseArgs')).default
  const syncBuckets = (await import('./lib/syncBuckets')).default

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

  let cloudfrontArn: string
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
      const AWS_PROFILE = await checkCurrentAWSProfile()

      const confirmation = await promptUser('Is the AWS profile correct?')

      if (!confirmation) {
        console.log(
          `Exiting script. Please configure the correct AWS profile through the ${AWS_PROFILE} environment and run the script again.`
        )
        return
      }

      const assumeRoleCredentials = await getAssumeRole(
        ROLE_ARN,
        'promoteToStaging'
      )
      const stagingCredentials = {
        accessKeyId: assumeRoleCredentials?.AccessKeyId ?? '',
        secretAccessKey: assumeRoleCredentials?.SecretAccessKey ?? '',
        sessionToken: assumeRoleCredentials?.SessionToken ?? '',
      }

      const s3 = new S3({
        region: 'us-east-1',
        credentials: stagingCredentials,
      })

      const sandboxBucket = `sandbox.${projectDomain}`
      const stagingBucket = `staging.${projectDomain}`

      const deployMetadata = await getDeployMetadata(s3, sandboxBucket)
      const { current } = deployMetadata
      console.log(
        `Promoting ${projectDomain} ${current} from sandbox to staging\n`
      )

      await syncBuckets(
        s3,
        { bucket: stagingBucket, path: tag },
        { bucket: stagingBucket },
        dryrun
      )
      console.log('Promotion to staging done\n')

      await getCreateInvalidation(stagingCredentials, cloudfrontArn)
      console.log('Cache invalidation initiated for staging\n')

      return
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }

  runPromoteToStaging()
})()
