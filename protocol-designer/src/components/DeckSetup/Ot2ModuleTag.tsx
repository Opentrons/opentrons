import * as React from 'react'

import {
  RobotCoordsForeignDiv,
  Text,
  COLORS,
  SPACING,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  ModuleDefinition,
  ModuleModel,
  ModuleOrientation,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

interface Ot2ModuleTagProps {
  dimensions: ModuleDefinition['dimensions']
  model: ModuleModel
  orientation: ModuleOrientation
}

export function Ot2ModuleTag(props: Ot2ModuleTagProps): JSX.Element {
  const { dimensions, model, orientation } = props
  const displayName = getModuleDisplayName(model)
  const isThermocyclerModel =
    model === THERMOCYCLER_MODULE_V1 || model === THERMOCYCLER_MODULE_V2
  const xDimension = dimensions.labwareInterfaceXDimension ?? 0
  const xCoordinateForOtherMods =
    orientation === 'left'
      ? -(xDimension / 2)
      : dimensions.labwareInterfaceXDimension

  return (
    <RobotCoordsForeignDiv
      width={
        isThermocyclerModel
          ? dimensions.labwareInterfaceXDimension
          : xDimension / 2
      }
      height={isThermocyclerModel ? 16 : 24}
      y={isThermocyclerModel ? -22 : 0}
      x={isThermocyclerModel ? 0 : xCoordinateForOtherMods}
      innerDivProps={{
        backgroundColor: COLORS.darkGreyEnabled,
        padding: SPACING.spacing4,
        height: '100%',
        color: COLORS.white,
      }}
    >
      <Text as="p" fontSize="0.5rem">
        {displayName}
      </Text>
    </RobotCoordsForeignDiv>
  )
}
