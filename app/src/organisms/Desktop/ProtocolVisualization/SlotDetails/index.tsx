import { useTranslation } from 'react-i18next'

import { Divider, RobotInfoLabel, StyledText } from '@opentrons/components'
import { getIsTiprack, getModuleDeckLabel } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { SlotDetailsEmptyState } from '/app/molecules/SlotDetailsEmptyState'

import { LabwareSlotContainer } from '../LabwareSlotContainer'
import { ModuleSlotDetails } from '../ModuleSlotDetails'
import { TipDisposalContainer } from '../TipDisposalContainer'
import { TipPickupContainer } from '../TipPickupContainer'
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
  const { t } = useTranslation('protocol_visualization')
  const stackOfLabwareOnSlot = getFullStackFromLabwares(labware, slotId)
  const moduleOnSlot = Object.entries(modules).find(
    ([id, module]) => module.slot === slotId
  )
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null
  const isTopmostLabwareATiprack =
    topMostLabwareOnSlot != null
      ? getIsTiprack(labwareEntities[topMostLabwareOnSlot].def)
      : false
  const isTrashOnSlot =
    Object.values(trashBinEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    ) ||
    Object.values(wasteChuteEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    ) ||
    slotId === 'fixedTrash'

  return (
    <div className={styles.slot_container}>
      <div className={styles.slot_details}>
        <div className={styles.command_step_header}>
          <div className={styles.slot_detail_header}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('slot')}
            </StyledText>
            {moduleOnSlot != null ? (
              <RobotInfoLabel
                deckLabel={getModuleDeckLabel(
                  moduleEntities[moduleOnSlot[0]].type,
                  slotId
                )}
              />
            ) : null}
            <RobotInfoLabel
              deckLabel={slotId === 'fixedTrash' ? t('fixedTrash') : slotId}
            />
          </div>
        </div>
        <Divider />
        {moduleOnSlot != null ? (
          <ModuleSlotDetails
            moduleId={moduleOnSlot[0]}
            moduleEntities={moduleEntities}
            moduleRobotState={modules}
          />
        ) : null}
        {topMostLabwareOnSlot != null && isTopmostLabwareATiprack ? (
          <TipPickupContainer
            tiprackEntity={labwareEntities[topMostLabwareOnSlot]}
            robotState={robotState}
          />
        ) : null}
        {topMostLabwareOnSlot != null && !isTopmostLabwareATiprack ? (
          <LabwareSlotContainer
            topLabwareOnSlotId={topMostLabwareOnSlot}
            labwareEntities={labwareEntities}
            commands={commands}
            currentCommand={command}
            liquids={liquids}
            robotState={robotState}
            pipetteEntities={pipetteEntities}
            moduleEntities={moduleEntities}
          />
        ) : null}
        {isTrashOnSlot ? (
          <TipDisposalContainer robotState={robotState} />
        ) : null}
        {moduleOnSlot == null &&
        topMostLabwareOnSlot == null &&
        !isTrashOnSlot ? (
          <SlotDetailsEmptyState />
        ) : null}
      </div>
    </div>
  )
}
