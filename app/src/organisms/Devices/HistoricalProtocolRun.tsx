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
import { formatInterval } from '../RunTimeControl/utils'
import { formatTimestamp } from './utils'
import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'
import { HistoricalRunOffsetDrawer as OffsetDrawer } from './HistoricalRunOffsetDrawer'
import type { RunData } from '@opentrons/api-client'

const EMPTY_TIMESTAMP = '--:--:--'

interface HistoricalProtocolRunProps {
  run: RunData
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
  const runDisplayName = formatTimestamp(run.createdAt)
  let duration = EMPTY_TIMESTAMP
  if (runStatus !== 'idle') {
    if (run.completedAt != null) {
      duration = formatInterval(run.createdAt, run.completedAt)
    } else {
      duration = formatInterval(run.createdAt, new Date().toString())
    }
  }
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
          {runDisplayName}
        </StyledText>
        <StyledText as="p" width="35%">
          {protocolName}
        </StyledText>
        <StyledText as="p" width="20%" textTransform="capitalize">
          {runStatus != null ? t(`status_${runStatus}`) : ''}
        </StyledText>
        <StyledText as="p" width="20%">
          {duration}
        </StyledText>
        <OverflowMenu
          run={run}
          protocolName={protocolName}
          robotName={robotName}
          robotIsBusy={robotIsBusy}
        />
      </Flex>
      {offsetDrawerOpen && <OffsetDrawer run={run} />}
    </>
  )
}
