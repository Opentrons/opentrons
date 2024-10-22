import { HashRouter } from 'react-router-dom'
import {
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
  TYPOGRAPHY,
  Link as LinkButton,
  COLORS,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { OpentronsAIRoutes } from './OpentronsAIRoutes'
import { useAuth0 } from '@auth0/auth0-react'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loading } from './molecules/Loading'
import { mixpanelAtom, tokenAtom } from './resources/atoms'
import { useGetAccessToken } from './resources/hooks'
import { initializeMixpanel } from './analytics/mixpanel'
import { useTrackEvent } from './resources/hooks/useTrackEvent'

export function OpentronsAI(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0()
  const [, setToken] = useAtom(tokenAtom)
  const [mixpanel] = useAtom(mixpanelAtom)
  const { getAccessToken } = useGetAccessToken()
  const trackEvent = useTrackEvent()

  initializeMixpanel(mixpanel)

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

  useEffect(() => {
    if (isAuthenticated) {
      trackEvent({ name: 'user-login', properties: {} })
    }
  }, [isAuthenticated])

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
        justifyContent={JUSTIFY_CENTER}
        backgroundColor={COLORS.grey10}
      >
        <Flex maxWidth="1440px" flexDirection={DIRECTION_COLUMN}>
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
      </Flex>
    </div>
  )
}
