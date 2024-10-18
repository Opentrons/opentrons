import { HashRouter } from 'react-router-dom'
import {
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
  TYPOGRAPHY,
  Link as LinkButton,
  COLORS,
} from '@opentrons/components'
import { OpentronsAIRoutes } from './OpentronsAIRoutes'
import { useAuth0 } from '@auth0/auth0-react'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loading } from './molecules/Loading'
import { tokenAtom } from './resources/atoms'
import { useGetAccessToken } from './resources/hooks'

export function OpentronsAI(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0()
  const [, setToken] = useAtom(tokenAtom)
  const { getAccessToken } = useGetAccessToken()

  const fetchAccessToken = async (): Promise<void> => {
    try {
      const accessToken = await getAccessToken()
      setToken(accessToken)
    } catch (error) {
      console.error('Error fetching access token:', error)
    }
  }

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      void loginWithRedirect()
    }
    if (isAuthenticated) {
      void fetchAccessToken()
    }
  }, [isAuthenticated, isLoading, loginWithRedirect])

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div
      id="opentrons-ai"
      style={{ width: '100%', height: '100vh', overflow: OVERFLOW_AUTO }}
    >
      <Flex
        height="100%"
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.grey10}
      >
        {/* this will be replaced by the header component */}
        <Flex>
          HEADER
          <LinkButton
            onClick={() => logout()}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {t('logout')}
          </LinkButton>
        </Flex>

        <HashRouter>
          <OpentronsAIRoutes />
        </HashRouter>

        {/* This will be replaced by the Footer component */}
        <div>FOOTER</div>
      </Flex>
    </div>
  )
}
