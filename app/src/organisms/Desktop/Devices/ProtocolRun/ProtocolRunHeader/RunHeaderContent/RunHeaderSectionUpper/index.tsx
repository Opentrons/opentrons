import { useTranslation } from 'react-i18next'

import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { AlertPrimaryButton, BORDERS, StyledText } from '@opentrons/components'

import { isCancellableStatus } from '/app/local-resources/runs/utils'
import { RunTimer } from '/app/molecules/RunTimer'
import { useRunControls } from '/app/organisms/RunTimeControl/hooks'
import { useRunCreatedAtTimestamp, useRunTimestamps } from '/app/resources/runs'

import { DisplayRunStatus } from '../../DisplayRunStatus'
import { ActionButton } from '../ActionButton'
import { LabeledValue } from '../LabeledValue'
import styles from './runheadersectionupper.module.css'

import type { RunHeaderContentProps } from '..'

// The upper row of Protocol Run Header.
export function RunHeaderSectionUpper(
  props: RunHeaderContentProps
): JSX.Element {
  const { runId, runStatus, runHeaderModalContainerUtils } = props
  const { t } = useTranslation('run_details')
  const { pause } = useRunControls(runId)

  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const handleCancelRunClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pause()
    }
    runHeaderModalContainerUtils.confirmCancelModalUtils.toggleModal()
  }

  return (
    <div className={styles.section_container}>
      <LabeledValue label={t('run')} value={createdAtTimestamp} />
      <LabeledValue
        label={t('status')}
        value={<DisplayRunStatus runStatus={runStatus} />}
      />
      <LabeledValue
        label={t('run_time')}
        value={
          <RunTimer
            runStatus={runStatus}
            startedAt={startedAt}
            stoppedAt={stoppedAt}
            completedAt={completedAt}
          />
        }
      />
      <div className={styles.buttons_container}>
        <div className={styles.buttons_inner}>
          {isCancellableStatus(runStatus) && (
            <AlertPrimaryButton
              borderRadius={BORDERS.borderRadiusFull}
              onClick={handleCancelRunClick}
            >
              <StyledText
                oddStyle="bodyTextSemiBold"
                desktopStyle="bodyDefaultSemiBold"
              >
                {t('cancel_run')}
              </StyledText>
            </AlertPrimaryButton>
          )}
          <ActionButton {...props}></ActionButton>
        </div>
      </div>
    </div>
  )
}
