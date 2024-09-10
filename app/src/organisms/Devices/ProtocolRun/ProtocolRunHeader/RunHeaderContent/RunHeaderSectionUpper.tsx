import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { Box, Flex, JUSTIFY_FLEX_END } from '@opentrons/components'

import { LabeledValue } from './LabeledValue'
import { DisplayRunStatus } from '../DisplayRunStatus'
import { RunTimer } from '../../RunTimer'
import { ActionButton } from './ActionButton'
import { useRunCreatedAtTimestamp } from '../../../hooks'
import { useRunTimestamps } from '../../../../RunTimeControl/hooks'

import type { RunHeaderContentProps } from '.'

// The upper row of Protocol Run Header.
export function RunHeaderSectionUpper(
  props: RunHeaderContentProps
): JSX.Element {
  const { runId, runStatus } = props

  const { t } = useTranslation('run_details')

  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)

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
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <ActionButton {...props} />
      </Flex>
    </Box>
  )
}

const SECTION_STYLE = css`
  display: grid;
  grid-template-columns: 4fr 3fr 3fr 4fr;
`
