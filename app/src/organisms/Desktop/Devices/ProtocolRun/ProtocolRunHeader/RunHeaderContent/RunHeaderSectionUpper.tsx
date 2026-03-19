import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  BORDERS,
  Box,
  DISPLAY_GRID,
  Flex,
  NO_WRAP,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { isCancellableStatus } from '/app/local-resources/runs/utils'
import { RunTimer } from '/app/molecules/RunTimer'
import { useRunControls } from '/app/organisms/RunTimeControl/hooks'
import { useRunCreatedAtTimestamp, useRunTimestamps } from '/app/resources/runs'

import { DisplayRunStatus } from '../DisplayRunStatus'
import { ActionButton } from './ActionButton'
import { LabeledValue } from './LabeledValue'

import type { RunHeaderContentProps } from '.'

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
      <Flex css={BUTTONS_CONTAINER_STYLE}>
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

const BUTTONS_CONTAINER_STYLE = css`
  justify-content: flex-end;

  @media (max-width: 60rem) {
    justify-content: flex-start;
  }
`

const SECTION_STYLE = css`
  display: ${DISPLAY_GRID};
  grid-template-columns: 4fr 3fr 3fr 4fr;

  @media (max-width: 60rem) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    row-gap: ${SPACING.spacing16};
  }
`
