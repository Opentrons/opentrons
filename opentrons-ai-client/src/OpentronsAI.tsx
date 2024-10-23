import { HashRouter } from 'react-router-dom'
import {
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
  COLORS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
} from '@opentrons/components'
import { OpentronsAIRoutes } from './OpentronsAIRoutes'
import { useAuth0 } from '@auth0/auth0-react'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { Loading } from './molecules/Loading'
import { headerWithMeterAtom, mixpanelAtom, tokenAtom } from './resources/atoms'
import { useGetAccessToken } from './resources/hooks'
import { initializeMixpanel } from './analytics/mixpanel'
import { useTrackEvent } from './resources/hooks/useTrackEvent'
import { Header } from './molecules/Header'
import { CLIENT_MAX_WIDTH } from './resources/constants'
import { Footer } from './molecules/Footer'
import { HeaderWithMeter } from './molecules/HeaderWithMeter'

export function OpentronsAI(): JSX.Element | null {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const [, setToken] = useAtom(tokenAtom)
  const [{ displayHeaderWithMeter, progress }] = useAtom(headerWithMeterAtom)
  const [mixpanelState, setMixpanelState] = useAtom(mixpanelAtom)
  const { getAccessToken } = useGetAccessToken()
  const trackEvent = useTrackEvent()

  const fetchAccessToken = async (): Promise<void> => {
    try {
      const accessToken = await getAccessToken()
      setToken(accessToken)
    } catch (error) {
      console.error('Error fetching access token:', error)
    }
  }

  if (mixpanelState?.isInitialized === false) {
    setMixpanelState({ ...mixpanelState, isInitialized: true })
    initializeMixpanel(mixpanelState)
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
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.grey10}
      >
        {displayHeaderWithMeter ? (
          <HeaderWithMeter progressPercentage={progress} />
        ) : (
          <Header />
        )}

        <Flex
          width="100%"
          height="100%"
          maxWidth={CLIENT_MAX_WIDTH}
          alignSelf={ALIGN_CENTER}
        >
          <HashRouter>
            <OpentronsAIRoutes />
          </HashRouter>
        </Flex>

        <Footer />
      </Flex>
    </div>
  )
}
