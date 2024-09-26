import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  SPACING,
  LegacyStyledText,
  CURSOR_POINTER,
} from '@opentrons/components'
import { formatInterval } from '/app/transformations/commands'
import { formatTimestamp } from '/app/transformations/runs'
import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'
import { HistoricalProtocolRunDrawer as Drawer } from './HistoricalProtocolRunDrawer'
import type { RunData } from '@opentrons/api-client'

const PROTOCOL_NAME_STYLE = css`
  overflow: ${OVERFLOW_HIDDEN};
  white-space: nowrap;
  text-overflow: ellipsis;
`

interface HistoricalProtocolRunProps {
  run: RunData
  protocolName: string
  robotName: string
  robotIsBusy: boolean
  protocolKey?: string
}

export function HistoricalProtocolRun(
  props: HistoricalProtocolRunProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run, protocolName, robotIsBusy, robotName, protocolKey } = props
  const [drawerOpen, setDrawerOpen] = useState(false)
  const countRunDataFiles =
    'runTimeParameters' in run
      ? run?.runTimeParameters.filter(
          parameter => parameter.type === 'csv_file'
        ).length
      : 0
  const runStatus = run.status
  const runDisplayName = formatTimestamp(run.createdAt)
  let duration = EMPTY_TIMESTAMP
  if (runStatus !== 'idle') {
    if (run.completedAt != null && run.startedAt != null) {
      duration = formatInterval(run.startedAt, run.completedAt)
    } else if (run.startedAt != null) {
      duration = formatInterval(run.startedAt, new Date().toString())
    }
  }

  return (
    <>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        padding={SPACING.spacing8}
        borderTop={BORDERS.lineBorder}
        backgroundColor={
          run.status === 'running' ? COLORS.blue10 : COLORS.white
        }
        width="100%"
        onClick={() => {
          setDrawerOpen(!drawerOpen)
        }}
        cursor="pointer"
      >
        <Flex width="88%" gridGap={SPACING.spacing20}>
          <LegacyStyledText
            as="p"
            width="25%"
            data-testid={`RecentProtocolRuns_Run_${protocolKey}`}
          >
            {runDisplayName}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            width="27%"
            data-testid={`RecentProtocolRuns_Protocol_${protocolKey}`}
            css={PROTOCOL_NAME_STYLE}
          >
            {protocolName}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            width="5%"
            data-testid={`RecentProtocolRuns_Files_${protocolKey}`}
          >
            {countRunDataFiles}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            width="14%"
            data-testid={`RecentProtocolRuns_Status_${protocolKey}`}
          >
            {runStatus === 'running' ? (
              <Icon
                name="circle"
                color={COLORS.blue50}
                size={SPACING.spacing4}
                marginX={SPACING.spacing4}
                marginBottom={SPACING.spacing4}
              />
            ) : null}
            {runStatus != null ? t(`status_${runStatus}`) : ''}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            width="14%"
            data-testid="RecentProtocolRuns_Duration"
          >
            {duration}
          </LegacyStyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <Box>
            <Icon
              name={drawerOpen ? 'chevron-up' : 'chevron-down'}
              size="1.25rem"
              css={{ cursor: CURSOR_POINTER }}
            />
          </Box>
          <OverflowMenu
            runId={run.id}
            robotName={robotName}
            robotIsBusy={robotIsBusy}
          />
        </Flex>
      </Flex>
      {drawerOpen ? <Drawer run={run} robotName={robotName} /> : null}
    </>
  )
}
