import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'

import styles from './preview.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface CommandStepsProps {
  groupedCommands: GroupedCommands | null
  analysis: ProtocolAnalysisOutput
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  percentComplete: number
  handlePause: () => void
  currentCommandIndex?: number
}
export function CommandSteps(props: CommandStepsProps): JSX.Element {
  const {
    currentCommandIndex,
    groupedCommands,
    analysis,
    setSelectedCommand,
    handlePause,
    percentComplete,
  } = props
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.detail_container}>
      <div className={styles.command_step}>
        <div className={styles.command_step_header}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('timeline')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('percent_complete', { percent: percentComplete.toFixed(0) })}
          </StyledText>
        </div>
        <div className={styles.command_step_groups}>
          <AnnotatedSteps
            currentCommandIndex={currentCommandIndex}
            analysis={analysis}
            groupedCommands={groupedCommands}
            setSelectedCommand={setSelectedCommand}
            handlePause={handlePause}
          />
        </div>
      </div>
    </div>
  )
}
