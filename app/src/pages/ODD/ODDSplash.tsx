import * as React from 'react'
import { Flex, DIRECTION_COLUMN, ALIGN_CENTER } from '@opentrons/components'
import logo from '../../assets/images/odd/opentrons_logo.png'

export function ODDSplash(): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      width="100%"
      //   padding={SPACING.spacing4}
      //   paddingTop={SPACING.spacing6}
      transform="translateY(25%)"
    >
      <img src={logo} alt="logo for splash" />
    </Flex>
  )
}
