import {
  FLEX_ROBOT_TYPE,
  parseInitialPipetteNamesByMount,
} from '@opentrons/shared-data'

// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import { ModuleSlotDetails } from '/app/pages/Desktop/Protocols/ProtocolVisualization/ModuleSlotDetails'

import { DestinationLabwareContainer } from './DestinationLabwareContainer'
import { DestinationTipsContainer } from './DestinationTipsContainer'
import { PipetteContainer } from './PipetteContainer'
import { SourceLabwareContainer } from './SourceLabwareContainer'
import { SourceWellViewContainer } from './SourceWellViewContainer'
import styles from './stepdetailcontainer.module.css'
import { TipPickupContainer } from './TipPickupContainer'

import type {
  LabwareDefinition,
  Liquid,
  ProtocolAnalysisOutput,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface StepDetailContainerProps {
  protocolKey: string
  commands: RunTimeCommand[]
  selectedSlot: string | null
  selectedRunTimeCommand: RunTimeCommand | null
  robotState: RobotState
  percentComplete: number
  analysis: ProtocolAnalysisOutput
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
  invariantContext: InvariantContext
  liquids: Liquid[]
}

export function StepDetailContainer({
  protocolKey,
  commands,
  selectedSlot,
  selectedRunTimeCommand,
  robotState,
  percentComplete,
  analysis,
  robotType,
  allRunDefs,
  invariantContext,
  liquids,
}: StepDetailContainerProps): JSX.Element {
  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    commands.length > 0
      ? parseInitialPipetteNamesByMount(commands)
      : { left: null, right: null }
  const is96Channel =
    leftMountPipetteName != null &&
    rightMountPipetteName == null &&
    (leftMountPipetteName === 'p1000_96' || leftMountPipetteName === 'p200_96')

  const { labware, modules } = robotState
  const {
    labwareEntities,
    trashBinEntities,
    wasteChuteEntities,
    moduleEntities,
    pipetteEntities,
  } = invariantContext
  const moduleOnSlot = Object.entries(modules).find(
    ([id, module]) => module.slot === selectedSlot
  )

  return (
    <div className={styles.container}>
      {leftMountPipetteName != null || is96Channel ? (
        <PipetteContainer
          mount={is96Channel ? 'left_right_mount' : 'left_mount'}
          pipetteName={leftMountPipetteName}
        />
      ) : null}
      {rightMountPipetteName != null ? (
        <PipetteContainer
          mount={'right_mount'}
          pipetteName={rightMountPipetteName}
        />
      ) : null}
      <TipPickupContainer protocolKey={protocolKey} />
      <SourceWellViewContainer />
      <SourceLabwareContainer />
      <DestinationLabwareContainer />
      <DestinationTipsContainer />
      {moduleOnSlot != null ? (
        <ModuleSlotDetails
          moduleId={moduleOnSlot[0]}
          moduleEntities={moduleEntities}
          moduleRobotState={modules}
        />
      ) : null}
      {/* <SlotDetails
        slotId={selectedSlot}
        command={selectedRunTimeCommand}
        robotState={robotState}
        percentComplete={percentComplete}
        analysis={analysis}
        robotType={robotType ?? FLEX_ROBOT_TYPE}
        allRunDefs={allRunDefs}
        invariantContext={invariantContext}
        liquids={liquids}
      /> */}
    </div>
  )
}
