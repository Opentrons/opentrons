import * as React from 'react'

import {
  Box,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_2,
  SPACING_1,
  ALIGN_CENTER,
} from '@opentrons/components'

import { ModuleInfo } from './ModuleInfo'
import { getModuleDisplayName } from '@opentrons/shared-data'

interface ModuleInfoProps {
  controlDisabledReason: string | null
  usbPort?: string | null
  hubPort?: string | null
}

export function ModuleInfo(props: ModuleInfoProps): JSX.Element {
  const { controlDisabledReason, usbPort, hubPort } = props

  return (
    <>
      <Flex marginBottom={SPACING_1} fontWeight={FONT_WEIGHT_SEMIBOLD}>
        {usbPort && (
          <Text marginRight={SPACING_2}>{`USB Port ${usbPort}:`}</Text>
        )}
        {hubPort && (
          <Text marginRight={SPACING_2}>{`Hub Port ${hubPort}:`}</Text>
        )}
        <Text>{getModuleDisplayName(module.model)}</Text>
      </Flex>

      <Flex flexDirection={DIRECTION_ROW}>
        <ModuleImage model={module.model} />
        <Box width="60%">
          <ModuleControls
            module={module}
            controlDisabledReason={controlDisabledReason}
          />
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <ModuleInfo module={module} />
      </Flex>
    </>
  )
}
export { NoModulesMessage } from './NoModulesMessage'
