import {
  CalibrationBlockRender,
  LabwareNameOverlay,
  LabwareRender,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import {
  getIsTiprack,
  getLabwareDisplayName,
  getLabwareViewBox,
} from '@opentrons/shared-data'

import styles from './styles.module.css'

import type { LabwareDefinition, Vector2D } from '@opentrons/shared-data'

interface CalibrationLabwareRenderProps {
  labwareDef: LabwareDefinition
  labwarePosition: Vector2D /** The labware will be translated so its origin is here. */
}

export function CalibrationLabwareRender(
  props: CalibrationLabwareRenderProps
): JSX.Element {
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
              y={minY - yDimension}
              transformWithSVG
              innerDivProps={{ className: styles.labware_ui_wrapper }}
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
