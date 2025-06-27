import {
  COLORS,
  CommandText,
  DeckInfoLabel,
  Divider,
  Icon,
  StyledText,
} from '@opentrons/components'
import {
  LabwareDefinition,
  Liquid,
  ProtocolAnalysisOutput,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import {
  getFullStackFromLabwares,
  getModuleIdFromRobotStateStack,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'

import { LabwareSlotDetails } from './LabwareSlotDetails'
import { ModuleSlotDetails } from './ModuleSlotDetails'
import styles from './preview.module.css'
import { TrashSlotDetails } from './trashSlotDetails'

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
  } = props
  const { labware, modules } = robotState
  const {
    labwareEntities,
    trashBinEntities,
    wasteChuteEntities,
    moduleEntities,
  } = invariantContext
  const { commands } = analysis
  const stackOfLabwareOnSlot = getFullStackFromLabwares(labware, slotId)
  const moduleOnSlot = Object.entries(modules).find(
    ([id, module]) => module.slot === slotId
  )
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null
  const isTrashOnSlot =
    Object.values(trashBinEntities).some(trash => trash.location === slotId) ||
    Object.values(wasteChuteEntities).some(trash => trash.location === slotId)

  return (
    <div className={styles.detailContainer} style={{ width: '100%' }}>
      <div className={styles.commandStep}>
        <div className={styles.commandStepHeader}>
          <div
            style={{ display: 'flex', gridGap: '4px', alignItems: 'center' }}
          >
            <StyledText desktopStyle="bodyLargeSemiBold">Slot</StyledText>
            <DeckInfoLabel deckLabel={slotId} />
          </div>
          <div onClick={onClose}>
            <Icon name="close" size="28px" />
          </div>
        </div>
        <Divider />
        <div
          className={styles.slotDetailsActiveStep}
          style={{ height: '100px' }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">Active step</StyledText>
          <div className={styles.commandText}>
            <CommandText
              command={command}
              robotType={robotType}
              color={COLORS.black90}
              commandTextData={analysis}
              allRunDefs={allRunDefs}
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
        {topMostLabwareOnSlot != null ? (
          <LabwareSlotDetails
            topLabwareOnSlotId={topMostLabwareOnSlot}
            labwareEntities={labwareEntities}
            commands={commands}
            currentCommand={command}
            liquids={liquids}
            robotState={robotState}
          />
        ) : null}
        {isTrashOnSlot ? (
          <TrashSlotDetails trashBinEntities={trashBinEntities} />
        ) : null}
      </div>
    </div>
  )
}

// volume of liquids
// update tip state
// follow active step in viewport
// allow for clicking on all slots, including empty ones
