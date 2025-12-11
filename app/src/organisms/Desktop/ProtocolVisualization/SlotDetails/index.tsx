import { getIsTiprack } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { SlotDetailsEmptyState } from '/app/molecules/SlotDetailsEmptyState'

import { ModuleContainer } from '../ModuleContainer'
import { LabwareSlot } from '../SecondWindow/LabwareSlot'
import { TipPickupSlot } from '../SecondWindow/TipPickupSlot'
import { TipDisposalContainer } from '../TipDisposalContainer'
import styles from './slotdetails.module.css'

import type {
  Liquid,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface SlotDetailsProps {
  slotId: string
  command: RunTimeCommand
  robotState: RobotState
  invariantContext: InvariantContext
  analysis: ProtocolAnalysisOutput
  liquids: Liquid[]
}
export function SlotDetails(props: SlotDetailsProps): JSX.Element {
  const { slotId, command, robotState, invariantContext, analysis, liquids } =
    props
  const { labware, modules } = robotState
  const {
    labwareEntities,
    trashBinEntities,
    wasteChuteEntities,
    moduleEntities,
    pipetteEntities,
  } = invariantContext
  const { commands } = analysis
  const stackOfLabwareOnSlot = getFullStackFromLabwares(labware, slotId)
  const moduleOnSlot = Object.entries(modules).find(
    ([id, module]) => module.slot === slotId
  )
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null
  const isTopmostLabwareATiprack =
    topMostLabwareOnSlot != null &&
    getIsTiprack(labwareEntities[topMostLabwareOnSlot].def)
  const isTrashOnSlot =
    Object.values(trashBinEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    ) ||
    Object.values(wasteChuteEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    ) ||
    slotId === 'fixedTrash'

  const isSlotEmpty =
    moduleOnSlot == null && topMostLabwareOnSlot == null && !isTrashOnSlot

  const getLabwareType = (): 'tiprack' | 'labware' | null => {
    if (topMostLabwareOnSlot == null) {
      return null
    }
    if (isTopmostLabwareATiprack === true) {
      return 'tiprack'
    }
    return 'labware'
  }

  const renderLabwareContent = (): JSX.Element | null => {
    const labwareType = getLabwareType()
    if (topMostLabwareOnSlot == null) {
      return null
    }
    switch (labwareType) {
      case 'tiprack':
        return (
          <TipPickupSlot
            tiprackEntity={labwareEntities[topMostLabwareOnSlot]}
            robotState={robotState}
          />
        )
      case 'labware':
        return (
          <LabwareSlot
            topLabwareOnSlotId={topMostLabwareOnSlot}
            labwareEntities={labwareEntities}
            commands={commands}
            currentCommand={command}
            liquids={liquids}
            robotState={robotState}
            pipetteEntities={pipetteEntities}
            moduleEntities={moduleEntities}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {isSlotEmpty ? (
        <div className={styles.slot_detail_container}>
          <SlotDetailsEmptyState slotId={slotId} />
        </div>
      ) : null}
      <div className={styles.slot_container}>
        <div className={styles.slot_details}>
          {renderLabwareContent()}
          {isTrashOnSlot ? (
            <TipDisposalContainer robotState={robotState} />
          ) : null}
          {moduleOnSlot != null ? (
            <ModuleContainer
              moduleId={moduleOnSlot[0]}
              moduleEntities={moduleEntities}
              moduleRobotState={modules}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
