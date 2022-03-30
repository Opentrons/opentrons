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
import { ModuleImage } from './ModuleImage'
import { ModuleUpdate } from './ModuleUpdate'
import { ModuleControls } from '../../../../molecules/ModuleControls'
import type { AttachedModule } from '../../../../redux/modules/types'
import {
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'

interface Props {
  module: AttachedModule
  controlDisabledReason: string | null
  usbPort?: string | null
  hubPort?: string | null
}

export function ModuleItem(props: Props): JSX.Element {
  const { module, controlDisabledReason, usbPort, hubPort } = props

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
          {module.type !== HEATERSHAKER_MODULE_TYPE && (
            <ModuleControls
              module={module}
              controlDisabledReason={controlDisabledReason}
            />
          )}
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <ModuleInfo module={module} />
        <ModuleUpdate
          hasAvailableUpdate={!!module.hasAvailableUpdate}
          controlDisabledReason={controlDisabledReason}
          moduleId={module.serial}
        />
      </Flex>
    </>
  )
}

export { NoModulesMessage } from './NoModulesMessage'
