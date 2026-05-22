import { COLORS, LabwareRender } from '@opentrons/components'
import {
  getSlotInLocationStack,
  HOPPER_STACKER_LOCATION,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { getAllWellContentsAtFrame } from '../utils/getAllWellContentsAtFrame'
import { getMissingTips } from '../utils/getMissingTips'

import type { Dispatch, SetStateAction } from 'react'
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
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
}

export function LabwareOnDeck(props: LabwareOnDeckProps): JSX.Element {
  const {
    labwareDef,
    labwareId,
    x,
    y,
    robotState,
    liquids,
    setSelectedSlot,
    setHoveredSlot,
  } = props
  const { tipState, pipettes: pipetteState, liquidState, labware } = robotState
  const slot = labware[labwareId].stack.includes(HOPPER_STACKER_LOCATION)
    ? `hopper${getSlotInLocationStack(labware[labwareId].stack)}`
    : getSlotInLocationStack(labware[labwareId].stack)
  const pipetteTemporalProperties = Object.entries(pipetteState).find(
    ([_, pipette]) => pipette.entityId === labwareId
  )
  const activeWellName =
    pipetteTemporalProperties != null
      ? pipetteTemporalProperties[1].wellName
      : null

  const wellGroup: WellGroup =
    activeWellName != null && labwareDef.wells[activeWellName] != null
      ? { [activeWellName]: null }
      : {}

  const allWellContentsForActiveItem = getAllWellContentsAtFrame(
    liquidState,
    labwareDef
  )
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[labwareId]
      : null
  const liquidDisplayColors = Object.fromEntries(
    liquids.map(liquid => [liquid.id, liquid.displayColor ?? COLORS.grey40])
  )

  const wellFill = wellFillFromWellContents(wellContents, liquidDisplayColors)

  const missingTips = getMissingTips(tipState, labwareId)

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => {
        setHoveredSlot(slot)
      }}
      onMouseLeave={() => {
        setHoveredSlot(null)
      }}
      onClick={() => {
        setSelectedSlot(slot)
      }}
      cursor="pointer"
    >
      <LabwareRender
        positioningMode="passThrough"
        definition={labwareDef}
        wellFill={wellFill}
        highlightedWells={wellGroup}
        missingTips={missingTips}
      />
    </g>
  )
}
