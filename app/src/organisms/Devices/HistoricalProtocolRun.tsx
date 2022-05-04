import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Box,
  Icon,
  SPACING,
  COLORS,
  JUSTIFY_SPACE_AROUND,
  ALIGN_CENTER,
  BORDERS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { useRunStatus } from '../RunTimeControl/hooks'
import { formatTimestamp } from './utils'
import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'
import type { RunSummaryData } from '@opentrons/api-client'

interface HistoricalProtocolRunProps {
  run: RunSummaryData
  protocolName: string
  robotName: string
  robotIsBusy: boolean
}

export function HistoricalProtocolRun(
  props: HistoricalProtocolRunProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run, protocolName, robotIsBusy, robotName } = props
  const [offsetDrawerOpen, setOffsetDrawerOpen] = React.useState(false)
  const runStatus = useRunStatus(run.id)
  const runDisplayId = formatTimestamp(run.createdAt)
  // add in format timestamp to format duration
  return (
    <>
      <Flex
        justifyContent={JUSTIFY_SPACE_AROUND}
        alignItems={ALIGN_CENTER}
        padding={SPACING.spacing3}
        borderBottom={offsetDrawerOpen ? '' : BORDERS.lineBorder}
        backgroundColor={
          run.status === 'running' ? COLORS.lightBlue : COLORS.white
        }
      >
        <Box
          onClick={() => setOffsetDrawerOpen(!offsetDrawerOpen)}
          role="button"
        >
          <Icon
            name={offsetDrawerOpen ? 'chevron-up' : 'chevron-down'}
            width="15px"
            marginRight={SPACING.spacing3}
          />
        </Box>
        <StyledText as="p" width="25%">
          {runDisplayId}
        </StyledText>
        <StyledText as="p" width="35%">
          {protocolName}
        </StyledText>
        <StyledText as="p" width="20%" textTransform="capitalize">
          {runStatus != null ? t(`status_${runStatus}`) : ''}
        </StyledText>
        <StyledText as="p" width="20%">
          duration
        </StyledText>
        <OverflowMenu
          runId={run.id}
          robotName={robotName}
          robotIsBusy={robotIsBusy}
        />
      </Flex>
      {offsetDrawerOpen && (
        <Box padding={SPACING.spacing4} backgroundColor={COLORS.medGrey}>
          LABWARE OFFSET DATA HERE
        </Box>
      )}
    </>
  )
}
