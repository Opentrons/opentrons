import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  DISPLAY_GRID,
  Flex,
  JUSTIFY_FLEX_END,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { formatTimestamp } from '/app/transformations/runs'
import { useRunControls } from '/app/organisms/RunTimeControl/hooks'
import {
  EMPTY_TIMESTAMP,
  useRunTimestamps,
  useCloseCurrentRun,
} from '/app/resources/runs'
import { LabeledValue } from './LabeledValue'
import { isCancellableStatus } from '../utils'

import type { RunHeaderContentProps } from '.'

// The lower row of Protocol Run Header.
export function RunHeaderSectionLower({
  runId,
  runStatus,
  runHeaderModalContainerUtils,
}: RunHeaderContentProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const { startedAt, completedAt } = useRunTimestamps(runId)
  const { pause } = useRunControls(runId)
  const { isClosingCurrentRun } = useCloseCurrentRun()

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP
  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

  const handleCancelRunClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pause()
    }
    runHeaderModalContainerUtils.confirmCancelModalUtils.toggleModal()
  }

  return (
    <Box css={SECTION_STYLE}>
      <LabeledValue label={t('protocol_start')} value={startedAtTimestamp} />
      <LabeledValue label={t('protocol_end')} value={completedAtTimestamp} />
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        {isCancellableStatus(runStatus) && (
          <SecondaryButton
            isDangerous
            onClick={handleCancelRunClick}
            disabled={isClosingCurrentRun}
          >
            {t('cancel_run')}
          </SecondaryButton>
        )}
      </Flex>
    </Box>
  )
}

const SECTION_STYLE = css`
  display: ${DISPLAY_GRID};
  grid-template-columns: 4fr 6fr 4fr;
  background-color: ${COLORS.grey10};
  padding: ${SPACING.spacing8};
  border-radius: ${BORDERS.borderRadius4};
`
