import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'

import styles from './commandsteps.module.css'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface CommandStepsProps {
  groupedCommands: GroupedCommands | null
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  percentComplete: number
  handlePause: () => void
  currentCommandIndex?: number
  milliSecondsPerFrame: number
  isGlobalPlaying: boolean
}
export function CommandSteps(props: CommandStepsProps): ReactNode {
  const {
    groupedCommands,
    analysis,
    setSelectedCommand,
    percentComplete,
    handlePause,
    currentCommandIndex,
    milliSecondsPerFrame,
    isGlobalPlaying,
  } = props
  const { t } = useTranslation('protocol_visualization')
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false)

  return (
    <div className={styles.detail_container}>
      <div className={styles.command_step}>
        <div className={styles.command_step_header}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('protocol_steps')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('percent_complete', { percent: percentComplete.toFixed(0) })}
          </StyledText>
        </div>
        <div
          className={`${styles.command_step_groups} ${isAtBottom ? styles.at_bottom : ''}`}
        >
          <AnnotatedSteps
            currentCommandIndex={currentCommandIndex}
            analysis={analysis}
            groupedCommands={groupedCommands}
            setSelectedCommand={setSelectedCommand}
            handlePause={handlePause}
            setIsAtBottom={setIsAtBottom}
            milliSecondsPerFrame={milliSecondsPerFrame}
            isGlobalPlaying={isGlobalPlaying}
          />
        </div>
      </div>
    </div>
  )
}
