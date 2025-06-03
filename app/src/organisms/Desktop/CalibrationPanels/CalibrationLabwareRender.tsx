import {
  CalibrationBlockRender,
  LabwareNameOverlay,
  LabwareRender,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import {
  getIsTiprack,
  getLabwareDisplayName,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import styles from './styles.module.css'

import type { CoordinateTuple, LabwareDefinition } from '@opentrons/shared-data'

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

  return (
    <g
      // TODO BEFORE MERGE
      transform={`translate(${String(slotDefPosition?.[0])}, ${String(
        slotDefPosition?.[1]
      )})`}
    >
      {
        // TODO: we can change this boolean to check to isCalibrationBlock instead of isTiprack to render any labware
        isTiprack ? (
          <>
            <LabwareRender definition={labwareDef} />
            <RobotCoordsForeignDiv
              // TODO BEFORE MERGE
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
          </>
        ) : (
          <CalibrationBlockRender labwareDef={labwareDef} />
        )
      }
    </g>
  )
}
