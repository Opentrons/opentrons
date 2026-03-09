import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  DISPLAY_GRID,
  SPACING,
} from '@opentrons/components'

import { EMPTY_TIMESTAMP, useRunTimestamps } from '/app/resources/runs'
import { formatTimestamp } from '/app/transformations/runs'

import { LabeledValue } from './LabeledValue'

import type { RunHeaderContentProps } from '.'

// The lower row of Protocol Run Header.
export function RunHeaderSectionLower({
  runId,
}: RunHeaderContentProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const { startedAt, completedAt } = useRunTimestamps(runId)

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP
  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

  return (
    <Box css={SECTION_STYLE}>
      <LabeledValue label={t('protocol_start')} value={startedAtTimestamp} />
      <LabeledValue label={t('protocol_end')} value={completedAtTimestamp} />
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
