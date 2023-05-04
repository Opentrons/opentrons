import { GlobalStyle } from '../atoms/GlobalStyle'
import { getConfig, getIsOnDevice } from '../redux/config'
import { DesktopApp } from './DesktopApp'
import { OnDeviceDisplayApp } from './OnDeviceDisplayApp'
import { TopPortalRoot } from './portal'
import { Flex, POSITION_FIXED, DIRECTION_ROW } from '@opentrons/components'
import * as React from 'react'
import { hot } from 'react-hot-loader/root'
import { useSelector } from 'react-redux'

const stopEvent = (event: React.MouseEvent): void => event.preventDefault()

export const AppComponent = (): JSX.Element | null => {
  const hasConfigLoaded = useSelector(getConfig) != null
  const isOnDevice = useSelector(getIsOnDevice)

  // render null until getIsOnDevice returns the isOnDevice value from config
  return hasConfigLoaded ? (
    <>
      <GlobalStyle isOnDevice={isOnDevice} />
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

export const App = hot(AppComponent)
