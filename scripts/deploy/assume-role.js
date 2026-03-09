const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts')

function getAssumeRole(roleArn, roleSessionName) {
  const client = new STSClient({ region: 'us-east-1' })

  return client
    .send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: roleSessionName,
      })
    )
    .then(
      data => data.Credentials,
      err => {
        throw err
      }
    )
}

module.exports = { getAssumeRole }
