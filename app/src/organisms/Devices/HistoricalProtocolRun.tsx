import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'
import { getStoredProtocols } from '../../redux/protocol-storage'
import { formatInterval } from '../RunTimeControl/utils'
import { formatTimestamp } from './utils'
import { EMPTY_TIMESTAMP } from './constants'
import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'
import { HistoricalProtocolRunDrawer as Drawer } from './HistoricalProtocolRunOffsetDrawer'
import type { RunData } from '@opentrons/api-client'
import type { State } from '../../redux/types'

const PROTOCOL_NAME_STYLE = css`
  overflow: hidden;
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
  const [drawer, setDrawerOpen] = React.useState(false)
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  const { data: protocolFileData } = useAllCsvFilesQuery(run.protocolId ?? '')
  const allProtocolDataFiles =
    protocolFileData != null ? protocolFileData.data.files : []
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
  const protocolKeyInStoredKeys = storedProtocols.find(
    ({ protocolKey: key }) => protocolKey === key
  )

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
          setDrawerOpen(!drawer)
        }}
        css={css`
          cursor: pointer;
        `}
      >
        <Flex width="88%" gridGap={SPACING.spacing20}>
          <StyledText
            as="p"
            width="25%"
            data-testid={`RecentProtocolRuns_Run_${String(protocolKey)}`}
          >
            {runDisplayName}
          </StyledText>
          {protocolKeyInStoredKeys != null ? (
            <StyledText
              as="p"
              width="27%"
              data-testid={`RecentProtocolRuns_Protocol_${String(protocolKey)}`}
              css={PROTOCOL_NAME_STYLE}
            >
              {protocolName}
            </StyledText>
          ) : (
            <StyledText
              as="p"
              width="27%"
              data-testid={`RecentProtocolRuns_Protocol_${String(protocolKey)}`}
              css={PROTOCOL_NAME_STYLE}
            >
              {protocolName}
            </StyledText>
          )}
          <StyledText
            as="p"
            width="5%"
            data-testid={`RecentProtocolRuns_Files_${String(protocolKey)}`}
          >
            {allProtocolDataFiles.length}
          </StyledText>
          <StyledText
            as="p"
            width="14%"
            textTransform="capitalize"
            data-testid={`RecentProtocolRuns_Status_${String(protocolKey)}`}
          >
            {runStatus === 'running' && (
              <Icon
                name="circle"
                color={COLORS.blue50}
                size={SPACING.spacing4}
                marginX={SPACING.spacing4}
                marginBottom={SPACING.spacing4}
              />
            )}
            {runStatus != null ? t(`status_${String(runStatus)}`) : ''}
          </StyledText>
          <StyledText
            as="p"
            width="14%"
            data-testid="RecentProtocolRuns_Duration"
          >
            {duration}
          </StyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <Box>
            <Icon
              name={drawer ? 'chevron-up' : 'chevron-down'}
              size="1.25rem"
              css={{ cursor: 'pointer' }}
            />
          </Box>
          <OverflowMenu
            runId={run.id}
            robotName={robotName}
            robotIsBusy={robotIsBusy}
          />
        </Flex>
      </Flex>
      {drawer ? <Drawer run={run} robotName={robotName} /> : null}
    </>
  )
}
