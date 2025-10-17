import { parseInitialPipetteNamesByMount } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { LabwareSlotDetails } from '/app/pages/Desktop/Protocols/ProtocolVisualization/LabwareSlotDetails'
// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import { ModuleSlotDetails } from '/app/pages/Desktop/Protocols/ProtocolVisualization/ModuleSlotDetails'
import { getActiveSlotForLabwareDetails } from '/app/pages/Desktop/Protocols/ProtocolVisualization/utils'

import { PipetteContainer } from './PipetteContainer'
import styles from './stepdetailcontainer.module.css'
import { TipDisposalContainer } from './TipDisposalContainer'
import { TipPickupContainer } from './TipPickupContainer'

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
  const { labwareEntities, pipetteEntities } = invariantContext
  const { labware, modules, pipettes } = robotState
  console.log('for tiprack use getActiveSlotForTiprackDetails')
  const activeSlot = getActiveSlotForLabwareDetails(
    Object.values(pipettes),
    robotState,
    invariantContext,
    currentCommand
  )
  const stackOfLabwareOnSlot =
    activeSlot != null ? getFullStackFromLabwares(labware, activeSlot) : []
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    commands.length > 0
      ? parseInitialPipetteNamesByMount(commands)
      : { left: null, right: null }
  const is96Channel =
    leftMountPipetteName != null &&
    rightMountPipetteName == null &&
    (leftMountPipetteName === 'p1000_96' || leftMountPipetteName === 'p200_96')

  const { moduleEntities } = invariantContext
  const moduleOnSlot = Object.entries(modules ?? {}).find(
    ([_, module]) => module.slot === activeSlot
  )

  const leftPipetteId =
    Object.entries(pipettes ?? {}).find(
      ([_, pipette]) => pipette.mount === 'left'
    )?.[0] ?? null
  const rightPipetteId =
    Object.entries(pipettes ?? {}).find(
      ([_, pipette]) => pipette.mount === 'right'
    )?.[0] ?? null

  const isLeftPipetteActive =
    'pipetteId' in currentCommand.params &&
    currentCommand.params.pipetteId === leftPipetteId &&
    leftPipetteId != null &&
    pipettes[leftPipetteId].entityId != null
  const isRightPipetteActive =
    'pipetteId' in currentCommand.params &&
    currentCommand.params.pipetteId === rightPipetteId &&
    rightPipetteId != null &&
    pipettes[rightPipetteId].entityId != null

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
      <TipPickupContainer protocolKey={protocolKey} />
      {topMostLabwareOnSlot != null ? (
        <LabwareSlotDetails
          topLabwareOnSlotId={topMostLabwareOnSlot}
          labwareEntities={labwareEntities}
          commands={commands}
          currentCommand={currentCommand}
          liquids={liquids}
          robotState={robotState}
          pipetteEntities={pipetteEntities}
        />
      ) : null}
      {/* <SourceWellViewContainer protocolKey={protocolKey} />
      <SourceLabwareContainer protocolKey={protocolKey} />
      <DestinationWellViewContainer protocolKey={protocolKey} />
      <DestinationLabwareContainer protocolKey={protocolKey} /> */}
      <TipDisposalContainer protocolKey={protocolKey} />
      {moduleOnSlot != null ? (
        <ModuleSlotDetails
          moduleId={moduleOnSlot[0]}
          moduleEntities={moduleEntities}
          moduleRobotState={{ [moduleOnSlot[0]]: moduleOnSlot[1] }}
        />
      ) : null}
    </div>
  )
}
