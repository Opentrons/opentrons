import {
  COLORS,
  CommandText,
  DeckInfoLabel,
  Divider,
  Icon,
  StyledText,
} from '@opentrons/components'
import { getModuleDeckLabel } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { LabwareSlotDetails } from './LabwareSlotDetails'
import { ModuleSlotDetails } from './ModuleSlotDetails'
import styles from './preview.module.css'
import { SlotDetailsEmptyState } from './SlotDetailsEmptyState'
import { TrashSlotDetails } from './TrashSlotDetails'

import type {
  LabwareDefinition,
  Liquid,
  ProtocolAnalysisOutput,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface SlotDetailsProps {
  slotId: string
  command: RunTimeCommand
  robotState: RobotState
  invariantContext: InvariantContext
  onClose: () => void
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
  analysis: ProtocolAnalysisOutput
  liquids: Liquid[]
  percentComplete: number
}
export function SlotDetails(props: SlotDetailsProps): JSX.Element {
  const {
    slotId,
    command,
    robotState,
    invariantContext,
    onClose,
    robotType,
    allRunDefs,
    analysis,
    liquids,
    percentComplete,
  } = props
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
  const isTrashOnSlot =
    Object.values(trashBinEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    ) ||
    Object.values(wasteChuteEntities).some(
      trash => trash.location.split('cutout')[1] === slotId
    )
  return (
    <div className={styles.slot_container}>
      <div className={styles.command_step}>
        <div className={styles.command_step_header}>
          <StyledText desktopStyle="bodyDefaultRegular">Timeline</StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
          >{`${percentComplete.toFixed(0)}% complete`}</StyledText>
        </div>
        <Divider />
        <div className={styles.command_text_container}>
          <StyledText desktopStyle="bodyDefaultRegular">Active step</StyledText>
          <div className={styles.command_text}>
            <CommandText
              command={command}
              robotType={robotType}
              color={COLORS.black90}
              commandTextData={analysis}
              allRunDefs={allRunDefs}
            />
          </div>
        </div>
      </div>
      <div className={styles.slot_details}>
        <div className={styles.command_step_header}>
          <div className={styles.slot_detail_header}>
            <StyledText desktopStyle="bodyLargeSemiBold">Slot</StyledText>
            <DeckInfoLabel
              deckLabel={
                moduleOnSlot != null
                  ? getModuleDeckLabel(moduleEntities[moduleOnSlot[0]].type, slotId)
                  : slotId
              }
            />
          </div>
          <div onClick={onClose} className={styles.cursor_pointer}>
            <Icon name="close" size="1.75rem" />
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
        {topMostLabwareOnSlot != null ? (
          <LabwareSlotDetails
            topLabwareOnSlotId={topMostLabwareOnSlot}
            labwareEntities={labwareEntities}
            commands={commands}
            currentCommand={command}
            liquids={liquids}
            robotState={robotState}
            pipetteEntities={pipetteEntities}
          />
        ) : null}
        {isTrashOnSlot ? (
          <TrashSlotDetails trashBinEntities={trashBinEntities} />
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
