const {
  CloudFrontClient,
  CreateInvalidationCommand,
} = require('@aws-sdk/client-cloudfront')

async function getCreateInvalidation(productionCredentials, cloudfrontArn) {
  const client = new CloudFrontClient({
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

  const data = await client.send(
    new CreateInvalidationCommand(cloudFrontParams)
  )
  return data.Invalidation.Id
}

module.exports = { getCreateInvalidation }
