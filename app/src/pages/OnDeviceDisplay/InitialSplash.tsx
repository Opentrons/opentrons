import * as React from 'react'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import logo from '../../assets/images/odd/opentrons_logo.png'

const SPLASH_DURATION = 4000

export function InitialSplash(): JSX.Element {
  const history = useHistory()

  React.useEffect(() => {
    const splashTimer = setTimeout(() => {
      history.push(`/select-network`)
    }, SPLASH_DURATION)
    return () => {
      clearTimeout(splashTimer)
    }
  }, [history])

  return (
    <Flex
      height="100vh"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      <img
        src={logo}
        alt="logo for splash screen"
        width="355px"
        height="99px"
      />
    </Flex>
  )
}
