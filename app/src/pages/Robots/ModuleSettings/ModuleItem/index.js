// @flow
import * as React from 'react'

import { Box, Flex, Text, FONT_WEIGHT_SEMIBOLD, DIRECTION_ROW } from '@opentrons/components'

import { ModuleInfo } from './ModuleInfo'
import { ModuleUpdate } from './ModuleUpdate'
import { ModuleControls } from '../../../../molecules/ModuleControls'
import type { AttachedModule } from '../../../../redux/modules/types'
import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '../../../../redux/modules'
import styles from './styles.css'

type Props = {|
  module: AttachedModule,
  controlDisabledReason: string | null,
  availableUpdate?: ?string,
|}

export function ModuleItem(props: Props): React.Node {
  const { module, controlDisabledReason } = props

  return (
    <Box className={styles.module_item}>
      <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>{getModuleDisplayName(module.model)}</Text>
      <Flex flexDirection={DIRECTION_ROW}>
        <ModuleInfo module={module} />
        <Box width="60%">
          <ModuleControls
            module={module}
            controlDisabledReason={controlDisabledReason}
          />
          <ModuleUpdate
            hasAvailableUpdate={!!module.hasAvailableUpdate}
            controlDisabledReason={controlDisabledReason}
            moduleId={module.serial}
          />
        </Box>
      </Flex>
    </Box>
  )
}

export { NoModulesMessage } from './NoModulesMessage'
