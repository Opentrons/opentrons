import { DIRECTION_ROW, Flex, POSITION_FIXED } from '@opentrons/components'
import { GlobalStyle } from '/app/atoms/GlobalStyle'
import { getConfig, getIsOnDevice } from '/app/redux/config'
import type { MouseEvent } from 'react'
import { useSelector } from 'react-redux'
import { DesktopApp } from './DesktopApp'
import { OnDeviceDisplayApp } from './OnDeviceDisplayApp'
import { TopPortalRoot } from './portal'

const stopEvent = (event: MouseEvent): void => {
  event.preventDefault()
}

export const App = (): JSX.Element | null => {
  const hasConfigLoaded = useSelector(getConfig) != null
  const isOnDevice = useSelector(getIsOnDevice)

  // render null until getIsOnDevice returns the isOnDevice value from config
  return hasConfigLoaded ? (
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
  ) : null
}
