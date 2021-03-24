// @flow
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
} from '@opentrons/components'

import { ModuleInfo } from './ModuleInfo'
import { ModuleImage } from './ModuleImage'
import { ModuleUpdate } from './ModuleUpdate'
import { ModuleControls } from '../../../../molecules/ModuleControls'
import type { AttachedModule } from '../../../../redux/modules/types'
import { getModuleDisplayName } from '@opentrons/shared-data'
import styles from './styles.css'

type Props = {|
  module: AttachedModule,
  controlDisabledReason: string | null,
  usbPort?: ?string,
|}

export function ModuleItem(props: Props): React.Node {
  const { module, controlDisabledReason, usbPort } = props

  return (
    <>
      <Flex marginBottom={SPACING_1}>
        {usbPort && (
          <Text
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginRight={SPACING_2}
          >{`USB Port ${usbPort}:`}</Text>
        )}
        <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {getModuleDisplayName(module.model)}
        </Text>
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
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
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
