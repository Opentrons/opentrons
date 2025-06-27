import { Dispatch, SetStateAction } from 'react'

import {
  COLORS,
  CommandText,
  DeckInfoLabel,
  DeckLabel,
  Divider,
  Icon,
  LabwareRender,
  RobotWorkSpace,
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
  getSlotInLocationStack,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'
import { GroupedCommands } from '/app/redux/protocol-storage'
import { getWellFillFromLabwareId } from '/app/transformations/analysis'
import { getLabwareInfoByLiquidId } from '/app/transformations/commands'

import { LabwareSlotDetails } from './LabwareSlotDetails'
import styles from './preview.module.css'

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
  const { labware } = robotState
  const { labwareEntities } = invariantContext
  const { commands } = analysis
  const stackOfLabwareOnSlot = getFullStackFromLabwares(labware, slotId)
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot.length > 1 ? stackOfLabwareOnSlot[0] : null

  return (
    <div className={styles.commandStepContainer} style={{ width: '100%' }}>
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
        <div className={styles.slotDetailsActiveStep}>
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
        {topMostLabwareOnSlot != null ? (
          <LabwareSlotDetails
            topLabwareOnSlotId={topMostLabwareOnSlot}
            labwareEntities={labwareEntities}
            commands={commands}
            currentCommand={command}
            liquids={liquids}
          />
        ) : null}
      </div>
    </div>
  )
}

// module info with module state
// labware with display name, nickname, then liquid then svg render of labware with liquids
