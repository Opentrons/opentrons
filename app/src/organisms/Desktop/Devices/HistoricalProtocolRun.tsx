import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { useRunGeneratedDataFiles } from '/app/resources/dataFiles/useRunGeneratedDataFiles'
import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import { formatInterval } from '/app/transformations/commands'
import { formatTimestamp } from '/app/transformations/runs'

import styles from './HistoricalProtocolRun.module.css'
import { HistoricalProtocolRunDrawer as Drawer } from './HistoricalProtocolRunDrawer'
import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'

import type { RunData } from '@opentrons/api-client'

const COLUMNS = '25% 27% 5% 14% 14% 12%'

interface HistoricalProtocolRunProps {
  run: RunData
  protocolName: string
  robotName: string
  robotIsBusy: boolean
  protocolKey?: string
}

// TODO(jh, 10-24-25): Refactor this component and children component to a
//  singularly exported namespace.
export function HistoricalProtocolRun(
  props: HistoricalProtocolRunProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run, protocolName, robotIsBusy, robotName, protocolKey } = props
  const [drawerOpen, setDrawerOpen] = useState(false)
  const outputFileIds = useRunGeneratedDataFiles(run.id)
  const imageFileCount = outputFileIds.jpeg.length > 0 ? 1 : 0
  const totalOutputFiles = outputFileIds.csv.length + imageFileCount
  const countRunDataFiles =
    'runTimeParameters' in run
      ? run?.runTimeParameters.filter(
          parameter => parameter.type === 'csv_file'
        ).length + totalOutputFiles
      : totalOutputFiles

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
        <Flex
          width="88%"
          display="grid"
          gridTemplateColumns={COLUMNS}
          gap={SPACING.spacing20}
        >
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid={`RecentProtocolRuns_Run_${protocolKey}`}
          >
            {runDisplayName}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid={`RecentProtocolRuns_Protocol_${protocolKey}`}
            className={styles.protocol_name}
          >
            {protocolName}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid={`RecentProtocolRuns_Files_${protocolKey}`}
          >
            {countRunDataFiles}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
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
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid="RecentProtocolRuns_Duration"
          >
            {duration}
          </StyledText>
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
            runHasImages={imageFileCount > 0}
          />
        </Flex>
      </Flex>
      {drawerOpen ? (
        <Drawer run={run} robotName={robotName} protocolName={protocolName} />
      ) : null}
    </>
  )
}
