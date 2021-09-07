import * as React from 'react'
import {
  Text,
  RobotCoordsForeignDiv,
  FONT_WEIGHT_SEMIBOLD,
  C_MED_LIGHT_GRAY,
  SPACING_1,
  SPACING_2,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  getModuleType,
  getModuleVizDims,
  ModuleModel,
  THERMOCYCLER_MODULE_TYPE,
  STD_SLOT_X_DIM,
  STD_SLOT_Y_DIM,
  getModuleDisplayName,
} from '@opentrons/shared-data'

export interface ModuleTagProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
}

// eyeballed width/height to match designs
const STANDARD_TAG_HEIGHT = 50
const STANDARD_TAG_WIDTH = 65
// thermocycler has its slot farther right = more width, and it has more lines of content = more height
const THERMOCYCLER_TAG_HEIGHT = 70
const THERMOCYCLER_TAG_WIDTH = 75

export const ModuleTag = (props: ModuleTagProps): JSX.Element => {
  const { x, y, orientation, moduleModel } = props
  const moduleType = getModuleType(moduleModel)
  const { childXOffset, childYOffset } = getModuleVizDims(
    orientation,
    moduleType
  )
  let tagHeight = STANDARD_TAG_HEIGHT
  let tagWidth = STANDARD_TAG_WIDTH

  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    tagHeight = THERMOCYCLER_TAG_HEIGHT
    tagWidth = THERMOCYCLER_TAG_WIDTH
  }
  return (
    <RobotCoordsForeignDiv
      x={
        x +
        (orientation === 'left'
          ? childXOffset - tagWidth
          : STD_SLOT_X_DIM + childXOffset)
      }
      y={y + childYOffset + (STD_SLOT_Y_DIM - tagHeight) / 2}
      height={tagHeight}
      width={tagWidth}
      innerDivProps={{
        'data-test': `ModuleTag_${moduleType}`,
        display: 'flex',
        justifyContent: JUSTIFY_CENTER,
        alignItems: ALIGN_CENTER,
        backgroundColor: C_MED_LIGHT_GRAY,
        padding: SPACING_1,
      }}
    >
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={'0.5rem'}
        marginBottom={SPACING_2}
      >
        {getModuleDisplayName(moduleModel)}
      </Text>
    </RobotCoordsForeignDiv>
  )
}
