import * as React from 'react'
import { Icon, IconName } from './Icon'
import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
} from '@opentrons/shared-data'

import type { ModuleType } from '@opentrons/shared-data'
import type { StyleProps } from '../primitives/types'

export const MODULE_ICON_NAME_BY_TYPE: { [type in ModuleType]: IconName } = {
  [MAGNETIC_BLOCK_TYPE]: 'ot-magnet-v2',
  [HEATERSHAKER_MODULE_TYPE]: 'ot-heater-shaker',
  [TEMPERATURE_MODULE_TYPE]: 'ot-temperature-v2',
  [MAGNETIC_MODULE_TYPE]: 'ot-magnet-v2',
  [THERMOCYCLER_MODULE_TYPE]: 'ot-thermocycler',
}

interface ModuleIconProps extends StyleProps {
  moduleType: ModuleType
}

export function ModuleIcon(props: ModuleIconProps): JSX.Element {
  const { moduleType, ...styleProps } = props
  const iconName = MODULE_ICON_NAME_BY_TYPE[moduleType]

  return (
    <Icon
      name={iconName}
      {...styleProps}
      data-testid={`ModuleIcon_${iconName}`}
    />
  )
}
