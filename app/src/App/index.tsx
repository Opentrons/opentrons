import { useSelector } from 'react-redux'

import { DIRECTION_ROW, Flex, POSITION_FIXED } from '@opentrons/components'

import { GlobalStyle } from '/app/atoms/GlobalStyle'
import { getConfig, getIsOnDevice } from '/app/redux/config'

import { DesktopApp } from './DesktopApp'
import { useWindowType } from './hooks'
import { OnDeviceDisplayApp } from './OnDeviceDisplayApp'
import { TopPortalRoot } from './portal'
import { SecondaryWindowApp } from './SecondaryWindowApp'

import type { MouseEvent } from 'react'

const stopEvent = (event: MouseEvent): void => {
  event.preventDefault()
}

export const App = (): JSX.Element | null => {
  const hasConfigLoaded = useSelector(getConfig) != null
  const isOnDevice = useSelector(getIsOnDevice)
  const windowType = useWindowType()

  // render null until both config and window type are loaded
  if (!hasConfigLoaded || windowType === null) {
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
        {isOnDevice ? <OnDeviceDisplayApp /> : <DesktopApp />}
      </Flex>
    </>
  )
}
