import * as React from 'react'
import {
  Flex,
  ModuleIcon as SharedModuleIcon,
  POSITION_RELATIVE,
  SPACING,
  useHoverTooltip,
} from '@opentrons/components'
import { Tooltip } from '../../atoms/Tooltip'

import type { AttachedModule } from '../../redux/modules/types'

interface ModuleIconProps {
  module: AttachedModule
  tooltipText: string
}

export function ModuleIcon(props: ModuleIconProps): JSX.Element {
  const { module, tooltipText } = props
  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <>
      <Flex {...targetProps}>
        <SharedModuleIcon
          moduleType={module.moduleType}
          size={SPACING.spacing4}
        />
      </Flex>

      <Flex position={POSITION_RELATIVE} marginTop={SPACING.spacingM}>
        <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
      </Flex>
    </>
  )
}
