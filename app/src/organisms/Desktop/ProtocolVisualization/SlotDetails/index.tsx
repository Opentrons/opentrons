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

import type { ReactNode } from 'react'
import type {
  Liquid,
  LoadLabwareRunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type {
  HopperLocationMapKey,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../DeckView'

interface SlotDetailsProps {
  slotId: string
  robotState: RobotState
  invariantContext: InvariantContext
  analysis: ProtocolAnalysisOutput
  liquids: Liquid[]
}
export function SlotDetails(props: SlotDetailsProps): ReactNode {
  const { slotId, robotState, invariantContext, analysis, liquids } = props
  const { labware, modules } = robotState
  const {
    labwareEntities,
    trashBinEntities,
    wasteChuteEntities,
    moduleEntities,
  } = invariantContext
  const { commands } = analysis
  const loadLabwareCommands = commands.filter(
    command => command.commandType === 'loadLabware'
  )
  const stackOfLabwareOnSlot = getFullStackFromLabwares(labware, slotId)
  const isHopperSlot = HOPPER_FAKE_LOCATIONS.includes(slotId)
  const mappedSlot = isHopperSlot
    ? FAKE_HOPPER_LOCATION_MAP[slotId as HopperLocationMapKey]
    : slotId
  const moduleOnSlot = Object.entries(modules).find(
    ([id, module]) => module.slot === mappedSlot
  )
  const labwareEntitiesExtended = Object.entries(labwareEntities).reduce(
    (acc: Record<string, LabwareEntityExtended>, [key, entity]) => {
      const matchingCommand =
        loadLabwareCommands.find(
          (command): command is LoadLabwareRunTimeCommand =>
            command.result?.labwareId === entity.id
        ) ?? null
      acc[key] = {
        ...entity,
        nickName: matchingCommand?.params?.displayName ?? null,
      }
      return acc
    },
    {}
  )

  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null
  const isTopmostLabwareATiprack =
    topMostLabwareOnSlot != null &&
    getIsTiprack(labwareEntities[topMostLabwareOnSlot].def)
  const isTrashOnSlot =
    Object.values(trashBinEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    ) || slotId === 'fixedTrash'
  const isWasteChuteOnSlot = Object.values(wasteChuteEntities).some(
    wasteChute => wasteChute.location.split('cutout')[1] === slotId
  )

  let disposalType: 'wasteChute' | 'trash' | null = null

  if (isWasteChuteOnSlot) {
    disposalType = 'wasteChute'
  } else if (isTrashOnSlot) {
    disposalType = 'trash'
  }

  const isSlotEmpty =
    moduleOnSlot == null && topMostLabwareOnSlot == null && disposalType == null

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
            tiprackEntity={labwareEntitiesExtended[topMostLabwareOnSlot]}
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
          {disposalType != null ? (
            <TipDisposalSlot
              robotState={robotState}
              disposalType={disposalType}
            />
          ) : null}
          {moduleOnSlot != null ? (
            <ModuleContainer
              moduleId={moduleOnSlot[0]}
              moduleEntities={moduleEntities}
              moduleRobotState={modules}
              slotId={mappedSlot}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
