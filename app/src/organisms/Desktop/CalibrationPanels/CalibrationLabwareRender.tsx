import {
  C_MED_DARK_GRAY,
  C_MED_GRAY,
  C_MED_LIGHT_GRAY,
  FONT_WEIGHT_SEMIBOLD,
  LabwareNameOverlay,
  LabwareRender,
  RobotCoordsForeignDiv,
  RobotCoordsText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getIsTiprack,
  getLabwareDisplayName,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import styles from './styles.module.css'

import type { CoordinateTuple, LabwareDefinition } from '@opentrons/shared-data'

const SHORT = 'SHORT'
const TALL = 'TALL'

interface CalibrationLabwareRenderProps {
  labwareDef: LabwareDefinition
  slotDefPosition: CoordinateTuple | null
}

export function CalibrationLabwareRender(
  props: CalibrationLabwareRenderProps
): JSX.Element {
  const { labwareDef, slotDefPosition } = props

  const title = getLabwareDisplayName(labwareDef)
  const dimensions = getSchema2Dimensions(labwareDef)
  const isTiprack = getIsTiprack(labwareDef)

  // TODO: we can change this boolean to check to isCalibrationBlock instead of isTiprack to render any labware
  return isTiprack ? (
    <g
      transform={`translate(${String(slotDefPosition?.[0])}, ${String(
        slotDefPosition?.[1]
      )})`}
    >
      <LabwareRender definition={labwareDef} />
      <RobotCoordsForeignDiv
        width={dimensions.xDimension}
        height={dimensions.yDimension}
        x={0}
        y={0 - dimensions.yDimension}
        transformWithSVG
        innerDivProps={{ className: styles.labware_ui_wrapper }}
      >
        {/* title is capitalized by CSS, and "µL" capitalized is "ML" */}
        <LabwareNameOverlay title={title.replace('µL', 'uL')} />
      </RobotCoordsForeignDiv>
    </g>
  ) : (
    <CalibrationBlockRender
      labwareDef={labwareDef}
      slotDefPosition={slotDefPosition}
    />
  )
}

export function CalibrationBlockRender(
  props: CalibrationLabwareRenderProps
): JSX.Element | null {
  const { labwareDef, slotDefPosition } = props
  const dimensions = getSchema2Dimensions(labwareDef)

  switch (labwareDef.parameters.loadName) {
    case 'opentrons_calibrationblock_short_side_right': {
      return (
        <g
          transform={`translate(${String(slotDefPosition?.[0])}, ${String(
            slotDefPosition?.[1]
          )})`}
        >
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
          <g transform="rotate(270)">
            <RobotCoordsText
              x={-55}
              y={5}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {TALL}
            </RobotCoordsText>
          </g>
          <g transform="rotate(90)">
            <RobotCoordsText
              x={25}
              y={-dimensions.xDimension + 5}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {SHORT}
            </RobotCoordsText>
          </g>
        </g>
      )
    }
    case 'opentrons_calibrationblock_short_side_left': {
      return (
        <g
          transform={`translate(${String(slotDefPosition?.[0])}, ${String(
            slotDefPosition?.[1]
          )})`}
        >
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
          <g transform="rotate(270)">
            <RobotCoordsText
              x={-55}
              y={5}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {SHORT}
            </RobotCoordsText>
          </g>
          <g transform="rotate(90)">
            <RobotCoordsText
              x={30}
              y={-dimensions.xDimension + 5}
              fill={C_MED_LIGHT_GRAY}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {TALL}
            </RobotCoordsText>
          </g>
        </g>
      )
    }
    default: {
      // should never reach this case
      return null
    }
  }
}
