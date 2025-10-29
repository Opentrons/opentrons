import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  BORDERS,
  Box,
  DISPLAY_GRID,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  NO_WRAP,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { RunTimer } from '/app/molecules/RunTimer'
import { useRunControls } from '/app/organisms/RunTimeControl/hooks'
import { useFeatureFlag } from '/app/redux/config'
import {
  useProtocolDetailsForRun,
  useRunCreatedAtTimestamp,
  useRunTimestamps,
} from '/app/resources/runs'

import { DisplayRunStatus } from '../DisplayRunStatus'
import { isCancellableStatus } from '../utils'
import { ActionButton } from './ActionButton'
import { LabeledValue } from './LabeledValue'

import type { RunHeaderContentProps } from '.'

// The upper row of Protocol Run Header.
export function RunHeaderSectionUpper(
  props: RunHeaderContentProps
): JSX.Element {
  const { runId, runStatus, robotName, runHeaderModalContainerUtils } = props
  const { t } = useTranslation('run_details')
  const enableProtocolTimeline = useFeatureFlag('protocolTimeline')
  const navigate = useNavigate()
  const { pause } = useRunControls(runId)

  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { protocolKey } = useProtocolDetailsForRun(runId)

  const handleVisualizeClick = (): void => {
    // need to encode URL to avoid spaces and slashes
    const encodedTimestamp = encodeURIComponent(createdAtTimestamp)
    const targetPath = `/devices/${robotName}/${runId}/${encodedTimestamp}/${protocolKey}/visualization`
    navigate(targetPath)
  }
  const handleCancelRunClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pause()
    }
    runHeaderModalContainerUtils.confirmCancelModalUtils.toggleModal()
  }

  return (
    <Box css={SECTION_STYLE}>
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
      <Flex
        justifyContent={JUSTIFY_FLEX_END}
        gridGap={enableProtocolTimeline ? SPACING.spacing4 : 0}
      >
        {enableProtocolTimeline && runStatus === RUN_STATUS_IDLE ? (
          <SecondaryButton onClick={handleVisualizeClick}>
            {t('visualize')}
          </SecondaryButton>
        ) : null}
        <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
          {isCancellableStatus(runStatus) && (
            <AlertPrimaryButton
              borderRadius={BORDERS.borderRadiusFull}
              onClick={handleCancelRunClick}
              id="RunHeader_cancelRunButton"
            >
              <StyledText
                oddStyle="bodyTextSemiBold"
                desktopStyle="bodyDefaultSemiBold"
                whiteSpace={NO_WRAP}
              >
                {t('cancel_run')}
              </StyledText>
            </AlertPrimaryButton>
          )}
          <ActionButton {...props}></ActionButton>
        </Flex>
      </Flex>
    </Box>
  )
}

const SECTION_STYLE = css`
  display: ${DISPLAY_GRID};
  grid-template-columns: 4fr 3fr 3fr 4fr;
`
