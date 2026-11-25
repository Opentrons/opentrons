import { useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

import { PlayPauseButton } from '../PlayPauseButton'
import { StopButton } from '../StopButton'
import styles from './playpauseheader.module.css'

import type { ReactNode } from 'react'
import type { RunStatus } from '@opentrons/api-client'

export interface ProtocolPlayPauseHeaderProps {
  runStatus: RunStatus | null
  onStop: () => void
  onTogglePlayPause: () => void
  protocolName: string | undefined
}

export function ProtocolPlayPauseHeader({
  runStatus,
  onStop,
  onTogglePlayPause,
  protocolName,
}: ProtocolPlayPauseHeaderProps): ReactNode {
  const { t } = useTranslation('run_details')

  const currentRunStatus = t(`status_${runStatus}`)

  return (
    <div className={styles.container}>
      <div className={styles.status_info}>
        <LegacyStyledText forwardedAs="h4" className={styles.status_text}>
          {currentRunStatus}
        </LegacyStyledText>
        <LegacyStyledText className={styles.title_text}>
          {protocolName}
        </LegacyStyledText>
      </div>
      <div className={styles.controls}>
        <StopButton onStop={onStop} buttonSize="6.26rem" iconSize="2.5rem" />
        <PlayPauseButton
          onTogglePlayPause={onTogglePlayPause}
          buttonSize="6.25rem"
          runStatus={runStatus}
          iconSize="2.5rem"
        />
      </div>
    </div>
  )
}
