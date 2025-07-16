import { COLORS, LabwareRender } from '@opentrons/components'
import { wellFillFromWellContents } from '@opentrons/step-generation'

import { getAllWellContentsAtFrame, getMissingTips } from './utils'

import type { WellGroup } from '@opentrons/components'
import type { LabwareDefinition2, Liquid } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

interface LabwareOnDeckProps {
  robotState: RobotState
  labwareDef: LabwareDefinition2
  labwareId: string
  liquids: Liquid[]
  x: number
  y: number
}

export function LabwareOnDeck(props: LabwareOnDeckProps): JSX.Element {
  const { labwareDef, labwareId, x, y, robotState, liquids } = props
  const { tipState, pipettes: pipetteState, liquidState } = robotState
  const pipetteTemporalProperties = Object.entries(pipetteState).find(
    ([_, pipette]) => pipette.entityId === labwareId
  )
  const activeWellName =
    pipetteTemporalProperties != null
      ? pipetteTemporalProperties[1].wellName
      : null
  const wellGroup: WellGroup | null =
    activeWellName != null
      ? {
          [activeWellName]: null,
        }
      : null

  const allWellContentsForActiveItem = getAllWellContentsAtFrame(
    liquidState,
    labwareDef
  )
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[labwareId]
      : null
  const liquidDisplayColors = liquids.map(
    liquid => liquid.displayColor ?? COLORS.grey40
  )

  const wellFill = wellFillFromWellContents(wellContents, liquidDisplayColors)

  const missingTips = getMissingTips(tipState, labwareId)

  return (
    <g transform={`translate(${x}, ${y})`}>
      <LabwareRender
        definition={labwareDef}
        wellFill={wellFill}
        highlightedWells={wellGroup}
        missingTips={missingTips}
      />
    </g>
  )
}
