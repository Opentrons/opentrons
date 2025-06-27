import { Dispatch, SetStateAction } from 'react'

import { COLORS, Divider, StyledText } from '@opentrons/components'
import { ProtocolAnalysisOutput } from '@opentrons/shared-data'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'
import { GroupedCommands } from '/app/redux/protocol-storage'

import styles from './preview.module.css'

interface CommandStepsProps {
  groupedCommands: GroupedCommands | null
  analysis: ProtocolAnalysisOutput
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  currentCommandIndex: number | undefined
}
export function CommandSteps(props: CommandStepsProps): JSX.Element {
  const {
    currentCommandIndex,
    groupedCommands,
    analysis,
    setSelectedCommand,
  } = props
  const commandLength = analysis.commands.length
  const percentComplete =
    currentCommandIndex != null
      ? (currentCommandIndex / commandLength) * 100
      : 0
  return (
    <div className={styles.commandStepContainer}>
      <div className={styles.commandStep}>
        <div className={styles.commandStepHeader}>
          <StyledText desktopStyle="bodyDefaultRegular">Timeline</StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
          >{`${percentComplete.toFixed(0)}% complete`}</StyledText>
        </div>
        <Divider />
        <div className={styles.commandStepGroups}>
          <AnnotatedSteps
            currentCommandIndex={currentCommandIndex}
            analysis={analysis}
            groupedCommands={groupedCommands}
            setSelectedCommand={setSelectedCommand}
          />
        </div>
      </div>
    </div>
  )
}
