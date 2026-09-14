import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_STOPPED,
  RUN_STATUSES_TERMINAL,
} from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  Banner,
  BORDERS,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_GRID,
  DISPLAY_INLINE,
  Flex,
  Icon,
  InfoScreen,
  LegacyStyledText,
  OVERFLOW_AUTO,
  SPACING,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import {
  formatRunTimeParameterValue,
  sortRuntimeParameters,
} from '@opentrons/shared-data'

import { Divider } from '/app/atoms/structure'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
} from '/app/resources/runs'

import type { ReactNode } from 'react'
import type { RunStatus } from '@opentrons/api-client'
import type { RunTimeParameter } from '@opentrons/shared-data'

interface ProtocolRunRuntimeParametersProps {
  runId: string
}
export function ProtocolRunRuntimeParameters({
  runId,
}: ProtocolRunRuntimeParametersProps): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const run = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  }).data
  const runStatus = run?.data.status ?? null

  const isRunTerminal =
    runStatus == null
      ? false
      : (RUN_STATUSES_TERMINAL as RunStatus[]).includes(runStatus)
  // we access runTimeParameters from the run record rather than the most recent analysis
  // because the most recent analysis may not reflect the selected run (e.g. cloning a run
  // from a historical protocol run from the device details page)
  const runTimeParametersFromRun =
    run?.data != null && 'runTimeParameters' in run?.data
      ? run?.data?.runTimeParameters
      : []
  const runTimeParametersFromAnalysis =
    mostRecentAnalysis?.runTimeParameters ?? []
  const runTimeParameters = isRunTerminal
    ? runTimeParametersFromRun
    : runTimeParametersFromAnalysis
  const hasRunTimeParameters = runTimeParameters.length > 0
  const hasCustomRunTimeParameterValues = runTimeParameters.some(parameter =>
    parameter.type !== 'csv_file' ? parameter.value !== parameter.default : true
  )

  const runActions = run?.data.actions
  const hasRunStarted = runActions?.some(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const isRunCancelledWithoutStarting =
    !hasRunStarted && runStatus === RUN_STATUS_STOPPED

  const sortedRunTimeParameters = sortRuntimeParameters(runTimeParameters)

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={hasRunTimeParameters ? SPACING.spacing16 : undefined}
        gridGap={SPACING.spacing10}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          {hasRunTimeParameters ? (
            <LegacyStyledText
              forwardedAs="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('parameters')}
            </LegacyStyledText>
          ) : null}
          {hasRunTimeParameters ? (
            <LegacyStyledText forwardedAs="label" color={COLORS.grey60}>
              {hasCustomRunTimeParameterValues
                ? t('custom_values')
                : t('default_values')}
            </LegacyStyledText>
          ) : null}
        </Flex>
        {hasRunTimeParameters ? (
          <RunTimeParametersBanner isRunTerminal={isRunTerminal} />
        ) : null}
      </Flex>
      {!hasRunTimeParameters ? (
        <Flex padding={SPACING.spacing16}>
          <InfoScreen
            content={
              isRunCancelledWithoutStarting
                ? t('run_never_started')
                : t('no_parameters_specified_in_protocol')
            }
          />
        </Flex>
      ) : (
        <>
          <Divider width="100%" />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            padding={SPACING.spacing16}
            height="28rem"
            overflowY={OVERFLOW_AUTO}
          >
            <StyledTable>
              <StyledTableHeaderContainer>
                <StyledTableHeader>{t('name')}</StyledTableHeader>
                <StyledTableHeader>{t('value')}</StyledTableHeader>
              </StyledTableHeaderContainer>
              <tbody>
                {sortedRunTimeParameters.map(
                  (parameter: RunTimeParameter, index: number) => (
                    <StyledTableRowComponent
                      key={`${index}_${parameter.variableName}`}
                      parameter={parameter}
                      index={index}
                      isLast={index === runTimeParameters.length - 1}
                      t={t}
                    />
                  )
                )}
              </tbody>
            </StyledTable>
          </Flex>
        </>
      )}
    </>
  )
}

interface RunTimeParametersBannerProps {
  isRunTerminal: boolean
}

function RunTimeParametersBanner({
  isRunTerminal,
}: RunTimeParametersBannerProps): ReactNode {
  const { t } = useTranslation('protocol_setup')

  return (
    <Banner type="informing" width="100%" iconMarginLeft={SPACING.spacing4}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {isRunTerminal ? t('download_files') : t('values_are_view_only')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {isRunTerminal
            ? t('all_files_associated')
            : t('cancel_and_restart_to_edit')}
        </LegacyStyledText>
      </Flex>
    </Banner>
  )
}

interface StyledTableRowComponentProps {
  parameter: RunTimeParameter
  index: number
  isLast: boolean
  t: any
}

const StyledTableRowComponent = (
  props: StyledTableRowComponentProps
): ReactNode => {
  const { parameter, index, isLast, t } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    <StyledTableRow isLast={isLast} key={`runTimeParameter-${index}`}>
      <StyledTableCell display="span">
        <LegacyStyledText
          forwardedAs="p"
          css={css`
            display: inline;
            padding-right: 8px;
          `}
        >
          {parameter.type === 'csv_file'
            ? t('csv_file')
            : parameter.displayName}
        </LegacyStyledText>
        {parameter.description != null ? (
          <>
            <Flex
              display={DISPLAY_INLINE}
              {...targetProps}
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name="information"
                size={SPACING.spacing12}
                color={COLORS.grey60}
                data-testid="Icon"
              />
            </Flex>
            <Tooltip css={TYPOGRAPHY.labelRegular} tooltipProps={tooltipProps}>
              {parameter.description}
            </Tooltip>
          </>
        ) : null}
      </StyledTableCell>
      <StyledTableCell>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing16}
          alignItems={ALIGN_CENTER}
        >
          <LegacyStyledText forwardedAs="p" css={PARAMETER_VALUE_TEXT_STYLE}>
            {parameter.type === 'csv_file'
              ? (parameter.file?.name ?? '')
              : formatRunTimeParameterValue(parameter, t)}
          </LegacyStyledText>
          {parameter.type === 'csv_file' ||
          parameter.default !== parameter.value ? (
            <Chip
              text={t('updated')}
              type="success"
              hasIcon={false}
              chipSize="small"
            />
          ) : null}
        </Flex>
      </StyledTableCell>
    </StyledTableRow>
  )
}

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`
const StyledTableHeaderContainer = styled.thead`
  display: ${DISPLAY_GRID};
  grid-template-columns: 0.35fr 0.35fr;
  grid-gap: ${SPACING.spacing48};
  border-bottom: ${BORDERS.lineBorder};
`

const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding-bottom: ${SPACING.spacing8};
`

interface StyledTableRowProps {
  isLast: boolean
}

const StyledTableRow = styled.tr<StyledTableRowProps>`
  display: ${DISPLAY_GRID};
  grid-template-columns: 0.35fr 0.35fr;
  grid-gap: ${SPACING.spacing48};
  border-bottom: ${props => (props.isLast ? 'none' : BORDERS.lineBorder)};
`

interface StyledTableCellProps {
  paddingRight?: string
  display?: string
}

const StyledTableCell = styled.td<StyledTableCellProps>`
  align-items: ${ALIGN_CENTER};
  display: ${props => (props.display != null ? props.display : 'table-cell')};
  padding: ${SPACING.spacing8} 0;
  padding-right: ${props =>
    props.paddingRight != null ? props.paddingRight : SPACING.spacing16};
`

const PARAMETER_VALUE_TEXT_STYLE = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
`
