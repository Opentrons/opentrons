import { useAuth0 } from '@auth0/auth0-react'

const audience = 'sandbox-ai-api'
export const useGetAuth0Token = async (): Promise<string | null> => {
  const { getAccessTokenSilently } = useAuth0()
  try {
    const accessToken = await getAccessTokenSilently({
      authorizationParams: {
        audience,
      },
    })
    return accessToken
  } catch (err) {
    console.error(`cannot get token: ${err}`)
  }
  return null
}
