import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { withStyleProps } from '../hocs/withStyleProps'
import { Icon } from './Icon'

import type { ReactNode } from 'react'
import type { ModuleType } from '@opentrons/shared-data'

export type ModuleIconName =
  | 'ot-magnet-v2'
  | 'ot-heater-shaker'
  | 'ot-temperature-v2'
  | 'ot-magnet-v2'
  | 'ot-thermocycler'
  | 'ot-absorbance'
  | 'ot-flex-stacker'
  | 'ot-vacuum'
export const MODULE_ICON_NAME_BY_TYPE: {
  [type in ModuleType]: ModuleIconName
} = {
  [MAGNETIC_BLOCK_TYPE]: 'ot-magnet-v2',
  [HEATERSHAKER_MODULE_TYPE]: 'ot-heater-shaker',
  [TEMPERATURE_MODULE_TYPE]: 'ot-temperature-v2',
  [MAGNETIC_MODULE_TYPE]: 'ot-magnet-v2',
  [THERMOCYCLER_MODULE_TYPE]: 'ot-thermocycler',
  [ABSORBANCE_READER_TYPE]: 'ot-absorbance',
  [FLEX_STACKER_MODULE_TYPE]: 'ot-flex-stacker',
  [VACUUM_MODULE_TYPE]: 'ot-vacuum',
}

interface ModuleIconProps {
  moduleType: ModuleType
}

function ModuleIconComponent(props: ModuleIconProps): ReactNode {
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

export const ModuleIcon = withStyleProps(ModuleIconComponent)
