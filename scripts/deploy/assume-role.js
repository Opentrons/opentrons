const AWS = require('aws-sdk')

function getAssumeRole(roleArn, roleSessionName) {
  const sts = new AWS.STS({ apiVersion: '2011-06-15' })

  return new Promise((resolve, reject) => {
    sts.assumeRole(
      {
        RoleArn: roleArn,
        RoleSessionName: roleSessionName,
      },
      (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.Credentials)
        }
      }
    )
  })
}

module.exports = { getAssumeRole }
