import {
  CalibrationBlockRender,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_FLEX_END,
  LabwareNameOverlay,
  LabwareRender,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import {
  getIsTiprack,
  getLabwareDisplayName,
  getLabwareViewBox,
} from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type { LabwareDefinition, Vector2D } from '@opentrons/shared-data'

interface CalibrationLabwareRenderProps {
  labwareDef: LabwareDefinition
  labwarePosition: Vector2D /** The labware will be translated so its origin is here. */
}

export function CalibrationLabwareRender(
  props: CalibrationLabwareRenderProps
): ReactNode {
  const { labwareDef, labwarePosition } = props

  const title = getLabwareDisplayName(labwareDef)
  const isTiprack = getIsTiprack(labwareDef)

  const { minX, minY, xDimension, yDimension } = getLabwareViewBox(labwareDef)

  return (
    <g transform={`translate(${labwarePosition.x}, ${labwarePosition.y})`}>
      {
        // TODO: we can change this boolean to check to isCalibrationBlock instead of isTiprack to render any labware
        isTiprack ? (
          <>
            <LabwareRender
              definition={labwareDef}
              positioningMode="passThrough"
            />
            <RobotCoordsForeignDiv
              width={xDimension}
              height={yDimension}
              x={minX}
              y={minY}
              innerDivProps={{
                display: DISPLAY_FLEX,
                flexDirection: DIRECTION_COLUMN,
                justifyContent: JUSTIFY_FLEX_END,
                transform: 'rotate(180deg) scaleX(-1)',
              }}
            >
              {/* title is capitalized by CSS, and "µL" capitalized is "ML" */}
              <LabwareNameOverlay title={title.replace('µL', 'uL')} />
            </RobotCoordsForeignDiv>
          </>
        ) : (
          <CalibrationBlockRender labwareDef={labwareDef} />
        )
      }
    </g>
  )
}
