import * as React from 'react'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import logo from '../../../assets/images/odd/opentrons_logo.png'

const SPLASH_DURATION = 4000

export function InitialSplash(): JSX.Element {
  const history = useHistory()

  React.useEffect(() => {
    // Note: After 4 sec, moving selectNetwork
    const splashTimer = setTimeout(() => {
      history.push(`/selectNetwork`)
    }, SPLASH_DURATION)
    return () => {
      clearTimeout(splashTimer)
    }
  }, [])

  return (
    <Flex
      height="100vh"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      <img src={logo} alt="logo for splash" width="355px" height="99px" />
    </Flex>
  )
}
