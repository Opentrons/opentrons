import { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAtom } from 'jotai'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
} from '@opentrons/components'

import { initializeMixpanel } from './analytics/mixpanel'
import { ExitConfirmModal } from './molecules/ExitConfirmModal'
import { Footer } from './molecules/Footer'
import { Header } from './molecules/Header'
import { HeaderWithMeter } from './molecules/HeaderWithMeter'
import { Loading } from './molecules/Loading'
import { OpentronsAIRoutes } from './OpentronsAIRoutes'
import {
  featureFlagsAtom,
  headerWithMeterAtom,
  mixpanelAtom,
  tokenAtom,
} from './resources/atoms'
import { CLIENT_MAX_WIDTH } from './resources/constants'
import { useGetAccessToken } from './resources/hooks'
import { useTrackEvent } from './resources/hooks/useTrackEvent'

export function OpentronsAI(): JSX.Element | null {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const [, setToken] = useAtom(tokenAtom)
  const [{ displayHeaderWithMeter, progress }] = useAtom(headerWithMeterAtom)
  const [mixpanelState, setMixpanelState] = useAtom(mixpanelAtom)
  const { getAccessToken } = useGetAccessToken()
  const [, setFeatureFlags] = useAtom(featureFlagsAtom)

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

  global.enablePrereleaseMode = () => {
    setFeatureFlags({ enablePrereleaseMode: true })
  }

  return (
    <HashRouter>
      <Flex width="100%" height="100vh" flexDirection={DIRECTION_COLUMN}>
        <StickyHeader>
          {displayHeaderWithMeter ? (
            <HeaderWithMeter progressPercentage={progress} />
          ) : (
            <Header />
          )}
        </StickyHeader>

        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          backgroundColor={COLORS.grey10}
          overflow={OVERFLOW_AUTO}
        >
          <Flex
            width="100%"
            maxWidth={CLIENT_MAX_WIDTH}
            alignSelf={ALIGN_CENTER}
            flex="1"
          >
            <ExitConfirmModal />
            <OpentronsAIRoutes />
          </Flex>
          <Footer />
        </Flex>
      </Flex>
    </HashRouter>
  )
}

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
`
