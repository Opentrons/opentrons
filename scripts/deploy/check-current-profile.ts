import { fromIni } from '@aws-sdk/credential-provider-ini'

export async function checkCurrentAWSProfile(): Promise<string> {
  try {
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
  } catch (err) {
    if (err instanceof Error) {
      console.error('An error occurred:', err.message)
      throw err
    } else {
      console.error('An unknown error occurred:', err)
      throw new Error('An unknown error occurred')
    }
  }
}
