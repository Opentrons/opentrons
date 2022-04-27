import * as React from 'react'
import { Icon, IconName } from './Icon'
import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { Tooltip } from '@opentrons/app/src/atoms/Tooltip/index'
import { Flex, TOOLTIP_BOTTOM, useHoverTooltip } from '..'
import { SPACING } from '../ui-style-constants'

import type { ModuleType, ModuleModel } from '@opentrons/shared-data'
import type { StyleProps } from '../primitives/types'

const MODULE_ICON_NAME_BY_TYPE: { [type in ModuleType]: IconName } = {
  [HEATERSHAKER_MODULE_TYPE]: 'ot-heater-shaker',
  [TEMPERATURE_MODULE_TYPE]: 'ot-temperature-v2',
  [MAGNETIC_MODULE_TYPE]: 'ot-magnet-v2',
  [THERMOCYCLER_MODULE_TYPE]: 'ot-thermocycler',
}

interface ModuleIconProps extends StyleProps {
  moduleType: ModuleType
  moduleModel?: ModuleModel
  tooltipText?: string
}

export function ModuleIcon(props: ModuleIconProps): JSX.Element {
  const { moduleType, moduleModel, tooltipText, ...styleProps } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
  })
  const iconName = MODULE_ICON_NAME_BY_TYPE[moduleType]

  return (
    <>
      <Icon
        name={iconName}
        {...styleProps}
        data-testid={`ModuleIcon_${iconName}`}
        {...targetProps}
      />
      {moduleModel != null && (
        <Flex position="relative" marginTop={SPACING.spacingM}>
          <Tooltip
            tooltipProps={tooltipProps}
            key={`ModuleIcon_tooltip_${moduleType}`}
          >
            {tooltipText}
          </Tooltip>
        </Flex>
      )}
    </>
  )
}
