import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BasicButton,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  InfoScreen,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SIZE_4,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { useIsRobotViewable } from '/app/redux-resources/robots'
import {
  useCurrentRunId,
  useNotifyAllRunsQuery,
  useRunStatuses,
} from '/app/resources/runs'

import { RECENT_PROTOCOL_RUNS_HEADER } from './constants'
import { DeleteRecordsModal } from './DeleteRecordsModal'
import { HistoricalProtocolRun } from './HistoricalProtocolRun'

interface RecentProtocolRunsProps {
  robotName: string
}

export function RecentProtocolRuns({
  robotName,
}: RecentProtocolRunsProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const isRobotViewable = useIsRobotViewable(robotName)
  const runsQueryResponse = useNotifyAllRunsQuery()
  const runs = runsQueryResponse?.data?.data
  const protocols = useAllProtocolsQuery()
  const currentRunId = useCurrentRunId()
  const { isRunTerminal } = useRunStatuses()
  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)

  // TODO: wire up delete runs handler
  const handleConfirmDeleteRuns = (): void => {
    setShowDeleteRecordsModal(false)
  }

  const robotIsBusy = currentRunId != null ? !isRunTerminal : false
  const allRunsMutable = [...(runs ?? [])]
  return (
    <>
      {showDeleteRecordsModal ? (
        <DeleteRecordsModal
          type="allRuns"
          onClose={() => {
            setShowDeleteRecordsModal(false)
          }}
          onConfirm={handleConfirmDeleteRuns}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_FLEX_START}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        flexDirection={DIRECTION_COLUMN}
        padding={`0 0 ${SPACING.spacing8}`}
        width="100%"
        marginBottom="6rem"
      >
        <Flex
          padding={SPACING.spacing16}
          borderBottom={BORDERS.lineBorder}
          width="100%"
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText desktopStyle="bodyLargeSemiBold" flex="1">
            {t('run_history')}
          </StyledText>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_FLEX_END}
            gridGap={SPACING.spacing8}
          >
            <BasicButton
              // TODO: wire up actions for downloading all
              onClick={() => {
                setShowDeleteRecordsModal(true)
              }}
              iconName="download"
            >
              {t('download_all')}
            </BasicButton>
            <BasicButton
              onClick={() => {
                setShowDeleteRecordsModal(true)
              }}
            >
              {t('delete_all')}
            </BasicButton>
          </Flex>
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
          minHeight={SIZE_4}
          padding={SPACING.spacing16}
          width="100%"
        >
          {isRobotViewable && allRunsMutable && allRunsMutable?.length > 0 && (
            <>
              <Flex
                display="grid"
                justifyContent={JUSTIFY_FLEX_START}
                padding={SPACING.spacing8}
                width="88%"
                marginRight="12%"
                gap={SPACING.spacing20}
                color={COLORS.grey60}
                gridTemplateColumns={RECENT_PROTOCOL_RUNS_HEADER}
              >
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_RunTitle"
                >
                  {t('run_date')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_ProtocolTitle"
                >
                  {t('protocol')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_StatusTitle"
                >
                  {t('status')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_FilesTitle"
                >
                  {t('files')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_DurationTitle"
                >
                  {t('run_duration')}
                </StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gap={SPACING.spacing4}
                width="100%"
              >
                {allRunsMutable
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )

                  .map((run, index) => {
                    const protocol = protocols?.data?.data.find(
                      protocol => protocol.id === run.protocolId
                    )
                    const protocolName =
                      protocol?.metadata.protocolName ??
                      protocol?.files[0].name ??
                      t('shared:loading') ??
                      ''

                    return (
                      <HistoricalProtocolRun
                        run={run}
                        protocolName={protocolName}
                        protocolKey={protocol?.key}
                        robotName={robotName}
                        robotIsBusy={robotIsBusy}
                        key={index}
                      />
                    )
                  })}
              </Flex>
            </>
          )}
          {!isRobotViewable && (
            <InfoScreen content={t('offline_recent_protocol_runs')} />
          )}
          {isRobotViewable && allRunsMutable?.length === 0 && (
            <LegacyStyledText
              forwardedAs="p"
              alignItems={ALIGN_CENTER}
              display={DISPLAY_FLEX}
              flex="1 0"
              id="RecentProtocolRuns_no_runs"
            >
              {t('no_protocol_runs')}
            </LegacyStyledText>
          )}
        </Flex>
      </Flex>
    </>
  )
}
