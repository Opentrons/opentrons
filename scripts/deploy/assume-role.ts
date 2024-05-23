import type { AssumeRoleCommandOutput } from '@aws-sdk/client-sts'

async function getAssumeRole(
  roleArn: string,
  roleSessionName: string
): Promise<AssumeRoleCommandOutput['Credentials']> {
  const { STSClient, AssumeRoleCommand } = (
    await import('@aws-sdk/client-sts')
  ).default
  const stsClient = new STSClient({ region: 'us-east-1' })

  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: roleSessionName,
  })

  try {
    const data = await stsClient.send(command)
    return data.Credentials
  } catch (err) {
    if (err instanceof Error) {
      console.error('An error occurred:', err.message)
    } else {
      console.error('An unknown error occurred:', err)
    }
    throw err
  }
}

export { getAssumeRole }
