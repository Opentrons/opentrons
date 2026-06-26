import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import { DisplayRunStatus } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/DisplayRunStatus'
import { useRunGeneratedDataFiles } from '/app/resources/dataFiles/useRunGeneratedDataFiles'
import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import { formatInterval } from '/app/transformations/commands'
import { formatTimestamp } from '/app/transformations/runs'

import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'
import styles from './recentprotocolruns.module.css'

import type { RunData } from '@opentrons/api-client'

// inclusive of overflow menu button
const RECENT_PROTOCOL_RUNS_COLUMNS = '30% 25% 16% 5% 14% 10%'

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
  const { run, protocolName, robotIsBusy, robotName, protocolKey } = props
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
          run.status === 'running' ? COLORS.blue10 : COLORS.grey20
        }
        borderRadius={BORDERS.borderRadius8}
        width="100%"
      >
        <Flex
          width="88%"
          display="grid"
          gridTemplateColumns={RECENT_PROTOCOL_RUNS_COLUMNS}
          gap={SPACING.spacing20}
          alignItems={ALIGN_CENTER}
        >
          <Flex
            flexShrink={0}
            data-testid={`RecentProtocolRuns_Run_${protocolKey}`}
          >
            <Tag type="default" text={runDisplayName} shrinkToContent />
          </Flex>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid={`RecentProtocolRuns_Protocol_${protocolKey}`}
            className={styles.protocol_name}
            title={protocolName}
          >
            {protocolName}
          </StyledText>
          <Flex data-testid={`RecentProtocolRuns_Status_${protocolKey}`}>
            <DisplayRunStatus runStatus={runStatus} />
          </Flex>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid={`RecentProtocolRuns_Files_${protocolKey}`}
          >
            {countRunDataFiles}
          </StyledText>
          <Flex flexShrink={0} data-testid="RecentProtocolRuns_Duration">
            <Tag type="default" text={duration} shrinkToContent />
          </Flex>
        </Flex>
        <OverflowMenu
          runId={run.id}
          robotName={robotName}
          robotIsBusy={robotIsBusy}
          runHasImages={imageFileCount > 0}
        />
      </Flex>
    </>
  )
}
