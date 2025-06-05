import {
  C_MED_DARK_GRAY,
  C_MED_GRAY,
  C_MED_LIGHT_GRAY,
  FONT_WEIGHT_SEMIBOLD,
  RobotCoordsText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getSchema2Dimensions } from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

// These strings match what's physically etched on the calibration block,
// so they probably shouldn't be localized.
const SHORT = 'SHORT'
const TALL = 'TALL'

interface CalibrationBlockRenderProps {
  labwareDef: LabwareDefinition
}

export function CalibrationBlockRender(
  props: CalibrationBlockRenderProps
): JSX.Element | null {
  const { labwareDef } = props
  const dimensions = getSchema2Dimensions(labwareDef)

  switch (labwareDef.parameters.loadName) {
    case 'opentrons_calibrationblock_short_side_right': {
      return (
        <>
          <rect
            width={dimensions.xDimension}
            height={dimensions.yDimension}
            rx="10"
            ry="10"
            x={0}
            y={0}
            fill={C_MED_DARK_GRAY}
          />
          <rect
            width={dimensions.xDimension / 2}
            height={dimensions.yDimension}
            rx="10"
            ry="10"
            x={0}
            y={0}
            fill={C_MED_GRAY}
          />
          <g transform="rotate(270, 5, 55)">
            <RobotCoordsText
              x={5}
              y={55}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {TALL}
            </RobotCoordsText>
          </g>
          <g transform={`rotate(90, ${dimensions.xDimension - 5}, 25)`}>
            <RobotCoordsText
              x={dimensions.xDimension - 5}
              y={25}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {SHORT}
            </RobotCoordsText>
          </g>
        </>
      )
    }
    case 'opentrons_calibrationblock_short_side_left': {
      return (
        <>
          <rect
            width={dimensions.xDimension}
            height={dimensions.yDimension}
            rx="10"
            ry="10"
            x={0}
            y={0}
            fill={C_MED_DARK_GRAY}
          />
          <rect
            width={dimensions.xDimension / 2}
            height={dimensions.yDimension}
            rx="10"
            ry="10"
            x={dimensions.xDimension / 2}
            y={0}
            fill={C_MED_GRAY}
          />
          <g transform="rotate(270, 5, 55)">
            <RobotCoordsText
              x={5}
              y={55}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {SHORT}
            </RobotCoordsText>
          </g>
          <g transform={`rotate(90, ${dimensions.xDimension - 5}, 30)`}>
            <RobotCoordsText
              x={dimensions.xDimension - 5}
              y={30}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {TALL}
            </RobotCoordsText>
          </g>
        </>
      )
    }
    default: {
      // should never reach this case
      return null
    }
  }
}
