import { parseInitialPipetteNamesByMount } from '@opentrons/shared-data'

// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import { ModuleSlotDetails } from '/app/pages/Desktop/Protocols/ProtocolVisualization/ModuleSlotDetails'

import { DestinationLabwareContainer } from './DestinationLabwareContainer'
import { DestinationWellViewContainer } from './DestinationWellViewContainer'
import { PipetteContainer } from './PipetteContainer'
import { SourceLabwareContainer } from './SourceLabwareContainer'
import { SourceWellViewContainer } from './SourceWellViewContainer'
import styles from './stepdetailcontainer.module.css'
import { TipDisposalContainer } from './TipDisposalContainer'
import { TipPickupContainer } from './TipPickupContainer'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface StepDetailContainerProps {
  protocolKey: string
  commands: RunTimeCommand[]
  selectedSlot: string | null
  robotState: RobotState
  invariantContext: InvariantContext
  selectedRunTimeCommand?: RunTimeCommand
}

export function StepDetailContainer({
  protocolKey,
  commands,
  selectedSlot,
  robotState,
  invariantContext,
  selectedRunTimeCommand,
}: StepDetailContainerProps): JSX.Element {
  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    commands.length > 0
      ? parseInitialPipetteNamesByMount(commands)
      : { left: null, right: null }
  const is96Channel =
    leftMountPipetteName != null &&
    rightMountPipetteName == null &&
    (leftMountPipetteName === 'p1000_96' || leftMountPipetteName === 'p200_96')

  const { moduleEntities } = invariantContext
  const moduleOnSlot = Object.entries(robotState.modules ?? {}).find(
    ([_, module]) => module.slot === selectedSlot
  )

  const leftPipetteId =
    Object.entries(robotState.pipettes ?? {}).find(
      ([_, pipette]) => pipette.mount === 'left'
    )?.[0] ?? null
  const rightPipetteId =
    Object.entries(robotState.pipettes ?? {}).find(
      ([_, pipette]) => pipette.mount === 'right'
    )?.[0] ?? null

  const isLeftPipetteActive =
    selectedRunTimeCommand?.params != null &&
    'pipetteId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.pipetteId === leftPipetteId &&
    leftPipetteId != null &&
    robotState.pipettes[leftPipetteId].entityId != null
  const isRightPipetteActive =
    selectedRunTimeCommand?.params != null &&
    'pipetteId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.pipetteId === rightPipetteId &&
    rightPipetteId != null &&
    robotState.pipettes[rightPipetteId].entityId != null

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
      <SourceWellViewContainer protocolKey={protocolKey} />
      <SourceLabwareContainer protocolKey={protocolKey} />
      <DestinationWellViewContainer protocolKey={protocolKey} />
      <DestinationLabwareContainer protocolKey={protocolKey} />
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
