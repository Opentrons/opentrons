import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'

import styles from './commandsteps.module.css'

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
    groupedCommands,
    analysis,
    setSelectedCommand,
    percentComplete,
    handlePause,
    currentCommandIndex,
  } = props
  const { t } = useTranslation('protocol_visualization')
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollRef.current
    const target = bottomRef.current
    if (root == null || target == null) return

    const io = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting)
      },
      { root, threshold: 1 }
    )

    io.observe(target)
    return () => {
      io.disconnect()
    }
  }, [])

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
          ref={scrollRef}
          className={`${styles.command_step_groups} ${isAtBottom ? styles.at_bottom : ''}`}
        >
          <AnnotatedSteps
            currentCommandIndex={currentCommandIndex}
            analysis={analysis}
            groupedCommands={groupedCommands}
            setSelectedCommand={setSelectedCommand}
            handlePause={handlePause}
          />
          <div ref={bottomRef} className={styles.bottom_sentinel} />
        </div>
      </div>
    </div>
  )
}
