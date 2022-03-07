import * as React from 'react'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { Icon, SIZE_1, SPACING_1, C_HARBOR_GRAY } from '@opentrons/components'

interface ModuleIconProps {
  moduleType:
    | typeof MAGNETIC_MODULE_TYPE
    | typeof TEMPERATURE_MODULE_TYPE
    | typeof THERMOCYCLER_MODULE_TYPE
    | typeof HEATERSHAKER_MODULE_TYPE
}

export const ModuleIcon = (props: ModuleIconProps): JSX.Element => {
  const { moduleType } = props
  const iconNamesByModuleType = {
    [MAGNETIC_MODULE_TYPE]: 'ot-magnet-v2',
    [TEMPERATURE_MODULE_TYPE]: 'ot-temperature-v2',
    [THERMOCYCLER_MODULE_TYPE]: 'ot-thermocycler',
    [HEATERSHAKER_MODULE_TYPE]: 'ot-heater-shaker',
  } as const

  return (
    <Icon
      name={iconNamesByModuleType[moduleType]}
      size={SIZE_1}
      marginRight={SPACING_1}
      color={C_HARBOR_GRAY}
      id={`ModuleIcon_${moduleType}`}
    />
  )
}
