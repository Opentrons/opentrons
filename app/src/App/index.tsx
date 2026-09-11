import { useSelector } from 'react-redux'

import { DIRECTION_ROW, Flex, POSITION_FIXED } from '@opentrons/components'

import { initializeSentry } from '/app/App/sentry'
import { GlobalStyle } from '/app/atoms/GlobalStyle'
import { getConfig } from '/app/redux/config'

import { DesktopApp } from './DesktopApp'
import { useWindowType } from './hooks/useWindowType'
import { OnDeviceDisplayApp } from './OnDeviceDisplayApp'
import { TopPortalRoot } from './portal'
import { SecondaryWindowApp } from './SecondaryWindowApp'

import type { MouseEvent } from 'react'

const stopEvent = (event: MouseEvent): void => {
  event.preventDefault()
}

export const App = (): JSX.Element | null => {
  const config = useSelector(getConfig)
  const windowType = useWindowType()

  // initialize renderer sentry
  if (config != null) {
    initializeSentry(config.analytics.optedIn)
  }

  // render null until both config and window type are loaded
  if (config == null || windowType === null) {
    return null
  }

  if (windowType === 'secondary') {
    return (
      <>
        <GlobalStyle />
        <Flex
          position={POSITION_FIXED}
          flexDirection={DIRECTION_ROW}
          width="100%"
          height="100vh"
          onDragOver={stopEvent}
          onDrop={stopEvent}
        >
          <SecondaryWindowApp />
        </Flex>
      </>
    )
  }

  return (
    <>
      <GlobalStyle />
      <Flex
        position={POSITION_FIXED}
        flexDirection={DIRECTION_ROW}
        width="100%"
        height="100vh"
        onDragOver={stopEvent}
        onDrop={stopEvent}
      >
        <TopPortalRoot />
        {windowType === 'odd-main' ? <OnDeviceDisplayApp /> : <DesktopApp />}
      </Flex>
    </>
  )
}
