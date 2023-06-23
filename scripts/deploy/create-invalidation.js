const AWS = require('aws-sdk')

function getCreateInvalidation(productionCredentials, cloudfrontArn) {
  const cloudfront = new AWS.CloudFront({
    apiVersion: '2019-03-26',
    region: 'us-east-1',
    credentials: productionCredentials,
  })
  const distributionId = cloudfrontArn.split('/')[1]
  const cloudFrontParams = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: 1,
        Items: ['/*'],
      },
    },
  }
  return cloudfront.createInvalidation(cloudFrontParams).promise()
}

module.exports = { getCreateInvalidation }
