import { useAuth0 } from '@auth0/auth0-react'
import {
  LOCAL_AUTH0_AUDIENCE,
  PROD_AUTH0_AUDIENCE,
  STAGING_AUTH0_AUDIENCE,
} from '../constants'

interface UseGetAccessTokenResult {
  getAccessToken: () => Promise<string>
}

export const useGetAccessToken = (): UseGetAccessTokenResult => {
  const { getAccessTokenSilently } = useAuth0()

  const auth0Audience = (): string => {
    switch (process.env.NODE_ENV) {
      case 'production':
        return PROD_AUTH0_AUDIENCE
      case 'staging':
        return STAGING_AUTH0_AUDIENCE
      case 'development':
        return LOCAL_AUTH0_AUDIENCE
      default:
        console.error(
          'Error: NODE_ENV variable is not valid:',
          process.env.NODE_ENV
        )
        return STAGING_AUTH0_AUDIENCE
    }
  }

  const getAccessToken = async (): Promise<string> => {
    try {
      const accessToken = await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Audience(),
        },
      })
      return accessToken
    } catch (error) {
      console.error('Error getting access token:', error)
      throw error
    }
  }

  return { getAccessToken }
}
