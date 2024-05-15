import { useAuth0 } from '@auth0/auth0-react'

interface UseGetAccessTokenResult {
  getAccessToken: () => Promise<string>
}

const audience = 'sandbox-ai-api'
export const useGetAccessToken = (): UseGetAccessTokenResult => {
  const { getAccessTokenSilently } = useAuth0()

  const getAccessToken = async (): Promise<string> => {
    try {
      const accessToken = await getAccessTokenSilently({
        authorizationParams: {
          audience,
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
