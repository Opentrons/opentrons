import { getLabwareViewBox } from '@opentrons/shared-data'

import {
  C_MED_DARK_GRAY,
  C_MED_GRAY,
  C_MED_LIGHT_GRAY,
  FONT_WEIGHT_SEMIBOLD,
  RobotCoordsText,
  TYPOGRAPHY,
} from '../..'

import type { LabwareDefinition } from '@opentrons/shared-data'

// These strings match what's physically etched on the calibration block,
// so they probably shouldn't be localized.
const SHORT = 'SHORT'
const TALL = 'TALL'

const TEXT_MARGIN = 5

interface CalibrationBlockRenderProps {
  /**
   * Must be a calibration block definition, e.g.
   * opentrons_calibrationblock_short_side_left or ..._short_side_right.
   */
  labwareDef: LabwareDefinition
}

/**
 * Render a top-down view of an OT-2 calibration block. This displays features specific
 * to calibration blocks, which the more general <Labware> component doesn't know
 * about.
 */
export function CalibrationBlockRender(
  props: CalibrationBlockRenderProps
): JSX.Element | null {
  const { labwareDef } = props
  const { minX, minY, xDimension, yDimension } = getLabwareViewBox(labwareDef)
  const textLeftX = minX + TEXT_MARGIN
  const textRightX = minX + xDimension - TEXT_MARGIN
  const textY = minY + yDimension / 2

  switch (labwareDef.parameters.loadName) {
    case 'opentrons_calibrationblock_short_side_right': {
      return (
        <>
          <rect
            width={xDimension}
            height={yDimension}
            rx="10"
            ry="10"
            x={minX}
            y={minY}
            fill={C_MED_DARK_GRAY}
          />
          <rect
            width={xDimension / 2}
            height={yDimension}
            rx="10"
            ry="10"
            x={minX}
            y={minY}
            fill={C_MED_GRAY}
          />
          <g
            transform={`rotate(
              270,
              ${textLeftX},
              ${textY}
            )`}
          >
            <RobotCoordsText
              x={textLeftX}
              y={textY}
              textAnchor="middle"
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {TALL}
            </RobotCoordsText>
          </g>
          <g
            transform={`rotate(
              90,
              ${textRightX},
              ${textY}
            )`}
          >
            <RobotCoordsText
              x={textRightX}
              y={textY}
              textAnchor="middle"
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
            width={xDimension}
            height={yDimension}
            rx="10"
            ry="10"
            x={minX}
            y={minY}
            fill={C_MED_DARK_GRAY}
          />
          <rect
            width={xDimension / 2}
            height={yDimension}
            rx="10"
            ry="10"
            x={minX + xDimension / 2}
            y={minY}
            fill={C_MED_GRAY}
          />
          <g
            transform={`rotate(
              270,
              ${textLeftX},
              ${textY}
            )`}
          >
            <RobotCoordsText
              x={textLeftX}
              y={textY}
              textAnchor="middle"
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {SHORT}
            </RobotCoordsText>
          </g>
          <g
            transform={`rotate(
              90,
              ${textRightX},
              ${textY}
            )`}
          >
            <RobotCoordsText
              x={textRightX}
              y={textY}
              textAnchor="middle"
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
      console.warn(
        '<CalibrationBlockRender> given a non-calibration-block labware definition. Rendering nothing.'
      )
      return null
    }
  }
}
