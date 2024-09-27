import { useTranslation } from 'react-i18next'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_FLEX_START,
  SIZE_4,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { HistoricalProtocolRun } from './HistoricalProtocolRun'
import { useIsRobotViewable } from '/app/redux-resources/robots'
import {
  useNotifyAllRunsQuery,
  useCurrentRunId,
  useRunStatuses,
} from '/app/resources/runs'

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
  const robotIsBusy = currentRunId != null ? !isRunTerminal : false
  const nonQuickTransferRuns = runs?.filter(run => {
    const protocol = protocols?.data?.data.find(
      protocol => protocol.id === run.protocolId
    )
    return protocol?.protocolKind !== 'quick-transfer'
  })

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius8}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      padding={`0 0 ${SPACING.spacing8}`}
      width="100%"
      marginBottom="6rem"
    >
      <LegacyStyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        borderBottom={BORDERS.lineBorder}
        padding={SPACING.spacing16}
        width="100%"
        id="RecentProtocolRuns_title"
      >
        {t('recent_protocol_runs')}
      </LegacyStyledText>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        minHeight={SIZE_4}
        paddingX={SPACING.spacing16}
        width="100%"
      >
        {isRobotViewable &&
          nonQuickTransferRuns &&
          nonQuickTransferRuns?.length > 0 && (
            <>
              <Flex
                justifyContent={JUSTIFY_FLEX_START}
                padding={SPACING.spacing8}
                width="88%"
                marginRight="12%"
                gridGap={SPACING.spacing20}
                color={COLORS.grey60}
              >
                <LegacyStyledText
                  as="p"
                  width="25%"
                  data-testid="RecentProtocolRuns_RunTitle"
                >
                  {t('run')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="p"
                  width="27%"
                  data-testid="RecentProtocolRuns_ProtocolTitle"
                >
                  {t('protocol')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="p"
                  width="5%"
                  data-testid="RecentProtocolRuns_FilesTitle"
                >
                  {t('files')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="p"
                  width="14%"
                  data-testid="RecentProtocolRuns_StatusTitle"
                >
                  {t('status')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="p"
                  width="14%"
                  data-testid="RecentProtocolRuns_DurationTitle"
                >
                  {t('run_duration')}
                </LegacyStyledText>
              </Flex>
              {nonQuickTransferRuns
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
            </>
          )}
        {!isRobotViewable && (
          <LegacyStyledText
            as="p"
            alignItems={ALIGN_CENTER}
            color={COLORS.grey50}
            display={DISPLAY_FLEX}
            flex="1 0"
            id="RecentProtocolRuns_offline"
          >
            {t('offline_recent_protocol_runs')}
          </LegacyStyledText>
        )}
        {isRobotViewable &&
          (nonQuickTransferRuns == null ||
            nonQuickTransferRuns.length === 0) && (
            <LegacyStyledText
              as="p"
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
  )
}
