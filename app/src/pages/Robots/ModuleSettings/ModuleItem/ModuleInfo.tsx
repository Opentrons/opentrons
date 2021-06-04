import * as React from 'react'

import {
  Box,
  Flex,
  Text,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
import type { AttachedModule } from '../../../../redux/modules/types'

interface Props {
  module: AttachedModule
}

export function ModuleInfo(props: Props): JSX.Element {
  const { serial, fwVersion } = props.module

  return (
    <Flex width="45%">
      <Box>
        <Flex
          marginLeft={SPACING_3}
          fontSize={FONT_SIZE_BODY_1}
          marginBottom={SPACING_2}
        >
          <Text marginRight={SPACING_1} fontWeight={FONT_WEIGHT_SEMIBOLD}>
            Serial number:
          </Text>
          <Text>{serial}</Text>
        </Flex>
        <Flex marginLeft={SPACING_3} fontSize={FONT_SIZE_BODY_1}>
          <Text marginRight={SPACING_1} fontWeight={FONT_WEIGHT_SEMIBOLD}>
            Firmware version:
          </Text>
          <Text>{fwVersion}</Text>
        </Flex>
      </Box>
    </Flex>
  )
}
