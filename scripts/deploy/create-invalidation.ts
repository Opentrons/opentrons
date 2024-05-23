import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront'

async function getCreateInvalidation(
  productionCredentials: any,
  cloudfrontArn: string
): Promise<any> {
  const cloudfrontClient = new CloudFrontClient({
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

  const command = new CreateInvalidationCommand(cloudFrontParams)

  try {
    const data = await cloudfrontClient.send(command)
    return data
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

export { getCreateInvalidation }
