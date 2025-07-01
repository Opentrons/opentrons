import { COLORS, Divider, StyledText } from '@opentrons/components'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'

import styles from './preview.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

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
    <div className={styles.detail_container}>
      <div className={styles.command_step}>
        <div className={styles.command_step_header}>
          <StyledText desktopStyle="bodyDefaultRegular">Timeline</StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
          >{`${percentComplete.toFixed(0)}% complete`}</StyledText>
        </div>
        <Divider />
        <div className={styles.command_step_groups}>
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
