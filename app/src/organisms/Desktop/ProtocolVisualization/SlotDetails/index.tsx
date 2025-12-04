import { useTranslation } from 'react-i18next'

import {
  Divider,
  MODULE_ICON_NAME_BY_TYPE,
  RobotInfoLabel,
} from '@opentrons/components'
import { getIsTiprack } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { SlotDetailsEmptyState } from '/app/molecules/SlotDetailsEmptyState'

import { LabwareSlotContainer } from '../LabwareSlotContainer'
import { ModuleContainer } from '../ModuleContainer'
import { TipDisposalContainer } from '../TipDisposalContainer'
import { TipPickupContainer } from '../TipPickupContainer'
import styles from './slotdetails.module.css'

import type {
  Liquid,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import { is } from 'date-fns/locale'

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


  const isSlotEmpty =  moduleOnSlot == null &&
        topMostLabwareOnSlot == null &&
        !isTrashOnSlot 

  return (
    <>
    {isSlotEmpty ? <div className={styles.slot_detail_container}><SlotDetailsEmptyState slotId={slotId} /></div> : null}
    <div className={styles.slot_container}>
      <div className={styles.slot_details}>
        <div className={styles.command_step_header}>
          <div className={styles.slot_detail_header}>
            <RobotInfoLabel
              deckLabel={slotId === 'fixedTrash' ? t('fixedTrash') : slotId}
            />
            {moduleOnSlot != null ? (
              <RobotInfoLabel
                iconName={
                  MODULE_ICON_NAME_BY_TYPE[moduleEntities[moduleOnSlot[0]].type]
                }
              />
            ) : null}
          </div>
        </div>
        <Divider />
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
