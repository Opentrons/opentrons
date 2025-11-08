import { parseInitialPipetteNamesByMount } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { LabwareSlotContainer } from './LabwareSlotContainer'
import { PipetteContainer } from './PipetteContainer'
import styles from './stepdetailcontainer.module.css'
import { TipDisposalContainer } from './TipDisposalContainer'
import { TipPickupContainer } from './TipPickupContainer'
import {
  getActiveSlotForLabwareDetails,
  getActiveSlotForTiprackDetails,
  getIsPipetteActive,
} from './utils'

import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface StepDetailContainerProps {
  protocolKey: string
  commands: RunTimeCommand[]
  robotState: RobotState
  invariantContext: InvariantContext
  liquids: Liquid[]
  currentCommand: RunTimeCommand
}

export function StepDetailContainer({
  protocolKey,
  commands,
  robotState,
  invariantContext,
  currentCommand,
  liquids,
}: StepDetailContainerProps): JSX.Element {
  const { labwareEntities, pipetteEntities, moduleEntities } = invariantContext
  const { labware, pipettes } = robotState
  const tiprackActiveSlot = getActiveSlotForTiprackDetails(
    Object.values(pipettes),
    robotState,
    invariantContext
  )
  const tiprackStack =
    tiprackActiveSlot != null
      ? getFullStackFromLabwares(labware, tiprackActiveSlot)
      : []
  const labwareActiveSlot = getActiveSlotForLabwareDetails(
    robotState,
    invariantContext,
    currentCommand
  )
  const stackOfLabwareOnSlot =
    labwareActiveSlot != null
      ? getFullStackFromLabwares(labware, labwareActiveSlot)
      : []
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null
  const tiprackOnSlot = tiprackStack.length > 1 ? tiprackStack[0] : null

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    commands.length > 0
      ? parseInitialPipetteNamesByMount(commands)
      : { left: null, right: null }
  const is96Channel =
    leftMountPipetteName != null &&
    rightMountPipetteName == null &&
    (leftMountPipetteName === 'p1000_96' || leftMountPipetteName === 'p200_96')

  const isLeftPipetteActive = getIsPipetteActive(
    'left',
    pipettes,
    currentCommand
  )
  const isRightPipetteActive = getIsPipetteActive(
    'right',
    pipettes,
    currentCommand
  )

  return (
    <div className={styles.container}>
      {leftMountPipetteName != null || is96Channel ? (
        <PipetteContainer
          mount={is96Channel ? 'left_right_mount' : 'left_mount'}
          pipetteName={leftMountPipetteName}
          selected={isLeftPipetteActive}
        />
      ) : null}
      {rightMountPipetteName != null ? (
        <PipetteContainer
          mount={'right_mount'}
          pipetteName={rightMountPipetteName}
          selected={isRightPipetteActive}
        />
      ) : null}
      {tiprackOnSlot != null && labwareEntities[tiprackOnSlot] != null ? (
        <TipPickupContainer
          tiprackEntity={labwareEntities[tiprackOnSlot]}
          robotState={robotState}
        />
      ) : null}
      {topMostLabwareOnSlot != null ? (
        <LabwareSlotContainer
          topLabwareOnSlotId={topMostLabwareOnSlot}
          labwareEntities={labwareEntities}
          commands={commands}
          currentCommand={currentCommand}
          liquids={liquids}
          robotState={robotState}
          pipetteEntities={pipetteEntities}
          moduleEntities={moduleEntities}
        />
      ) : null}
      <TipDisposalContainer robotState={robotState} />
    </div>
  )
}
