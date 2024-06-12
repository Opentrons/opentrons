const { fromIni } = require('@aws-sdk/credential-provider-ini')

async function checkCurrentAWSProfile() {
  const credentials = await fromIni()()
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    throw new Error(
      'AWS credentials not found. Please configure your AWS credentials before running this script.'
    )
  } else {
    const currentProfile = process.env.AWS_PROFILE || 'default'
    console.log(`Current AWS profile: ${currentProfile}`)
    return currentProfile
  }
}

module.exports = { checkCurrentAWSProfile }
