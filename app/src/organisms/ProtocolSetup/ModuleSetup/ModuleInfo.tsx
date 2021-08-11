import * as React from 'react'
import {
  Text,
  RobotCoordsForeignDiv,
  SPACING_3,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  COLOR_ERROR,
} from '@opentrons/components'
import {
  getModuleType,
  ModuleModel,
  getModuleVizDims,
  STD_SLOT_X_DIM as SLOT_X,
  STD_SLOT_Y_DIM as SLOT_Y,
  getModuleDisplayName,
} from '@opentrons/shared-data'

export interface ModuleInfoProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
}

export const ModuleInfo = (props: ModuleInfoProps): JSX.Element => {
  const { x, y, orientation, moduleModel } = props
  const moduleType = getModuleType(moduleModel)
  const { childYOffset } = getModuleVizDims(orientation, moduleType)

  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y + childYOffset}
      height={SLOT_Y}
      width={SLOT_X}
      innerDivProps={{
        justifyContent: JUSTIFY_CENTER,
        alignItems: ALIGN_CENTER,
        padding: SPACING_3,
      }}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_ROW}>
          <Icon
            name="alert-circle"
            height="10px"
            width="10px"
            color={COLOR_ERROR}
          />

          <Text font_family={'Open Sans'} fontSize={'0.45rem'}>
            &nbsp; Not Connected
          </Text>
        </Flex>
        <Text font_family={'Open Sans'} fontSize={'0.65rem'} fontStyle={'bold'}>
          {getModuleDisplayName(moduleModel)}
        </Text>
        <Text
          font_family={'Open Sans'}
          fontSize={'0.4rem'}
          fontStyle={'italic'}
        >
          No USB Port Yet
        </Text>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
