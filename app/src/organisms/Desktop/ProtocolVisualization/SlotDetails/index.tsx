import { getIsTiprack } from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getFullStackFromLabwares,
  HOPPER_FAKE_LOCATIONS,
} from '@opentrons/step-generation'

import { SlotDetailsEmptyState } from '/app/molecules/SlotDetailsEmptyState'

import { ModuleContainer } from '../ModuleContainer'
import { LabwareSlot } from '../SecondWindow/LabwareSlot'
import { TipDisposalSlot } from '../SecondWindow/TipDisposalSlot'
import { TipPickupSlot } from '../SecondWindow/TipPickupSlot'
import styles from './slotdetails.module.css'

import type { Liquid, ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type {
  HopperLocationMapKey,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'

interface SlotDetailsProps {
  slotId: string
  robotState: RobotState
  invariantContext: InvariantContext
  analysis: ProtocolAnalysisOutput
  liquids: Liquid[]
}
export function SlotDetails(props: SlotDetailsProps): JSX.Element {
  const { slotId, robotState, invariantContext, analysis, liquids } = props
  const { labware, modules } = robotState
  const {
    labwareEntities,
    trashBinEntities,
    wasteChuteEntities,
    moduleEntities,
  } = invariantContext
  const { commands } = analysis
  const stackOfLabwareOnSlot = getFullStackFromLabwares(labware, slotId)
  const isHopperSlot = HOPPER_FAKE_LOCATIONS.includes(slotId)
  const mappedSlot = isHopperSlot
    ? FAKE_HOPPER_LOCATION_MAP[slotId as HopperLocationMapKey]
    : slotId
  const moduleOnSlot = Object.entries(modules).find(
    ([id, module]) => module.slot === mappedSlot
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
            liquids={liquids}
            robotState={robotState}
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
          {isTrashOnSlot ? <TipDisposalSlot robotState={robotState} /> : null}
          {moduleOnSlot != null ? (
            <ModuleContainer
              moduleId={moduleOnSlot[0]}
              moduleEntities={moduleEntities}
              moduleRobotState={modules}
              slotId={slotId}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
