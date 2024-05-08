import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ViewportList, ViewportListRef } from 'react-viewport-list'

import { RUN_STATUSES_TERMINAL } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DISPLAY_NONE,
  Flex,
  POSITION_FIXED,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  useNotifyAllCommandsAsPreSerializedList,
  useNotifyLastRunCommandKey,
} from '../../resources/runs'
import { CommandText } from '../CommandText'
import { Divider } from '../../atoms/structure'
import { NAV_BAR_WIDTH } from '../../App/constants'
import { CommandIcon } from './CommandIcon'
import { useRunStatus } from '../RunTimeControl/hooks'

import type { RunStatus } from '@opentrons/api-client'
import type { RobotType } from '@opentrons/shared-data'

const COLOR_FADE_MS = 500
const LIVE_RUN_COMMANDS_POLL_MS = 3000
// arbitrary large number of commands
const MAX_COMMANDS = 100000

interface RunPreviewProps {
  runId: string
  robotType: RobotType
  jumpedIndex: number | null
  makeHandleScrollToStep: (index: number) => () => void
}
export const RunPreviewComponent = (
  { runId, jumpedIndex, makeHandleScrollToStep, robotType }: RunPreviewProps,
  ref: React.ForwardedRef<ViewportListRef>
): JSX.Element | null => {
  const { t } = useTranslation('run_details')
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const runStatus = useRunStatus(runId)
  const isRunTerminal =
    runStatus != null
      ? (RUN_STATUSES_TERMINAL as RunStatus[]).includes(runStatus)
      : false
  // we only ever want one request done for terminal runs because this is a heavy request
  const commandsFromQuery = useNotifyAllCommandsAsPreSerializedList(
    runId,
    { cursor: 0, pageLength: MAX_COMMANDS },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      enabled: isRunTerminal,
    }
  ).data?.data
  const nullCheckedCommandsFromQuery =
    commandsFromQuery == null ? robotSideAnalysis?.commands : commandsFromQuery
  const viewPortRef = React.useRef<HTMLDivElement | null>(null)
  const currentRunCommandKey = useNotifyLastRunCommandKey(runId, {
    refetchInterval: LIVE_RUN_COMMANDS_POLL_MS,
  })
  const [
    isCurrentCommandVisible,
    setIsCurrentCommandVisible,
  ] = React.useState<boolean>(true)
  if (robotSideAnalysis == null) return null
  const commands =
    (isRunTerminal
      ? nullCheckedCommandsFromQuery
      : robotSideAnalysis.commands) ?? []
  const currentRunCommandIndex = commands.findIndex(
    c => c.key === currentRunCommandKey
  )

  return (
    <Flex
      ref={viewPortRef}
      flexDirection={DIRECTION_COLUMN}
      height="28rem"
      width="100%"
      overflowY="scroll"
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
    >
      <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
        <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('run_preview')}
        </StyledText>
        <StyledText as="label" color={COLORS.grey50}>
          {t('steps_total', { count: commands.length })}
        </StyledText>
      </Flex>
      <StyledText as="p" marginBottom={SPACING.spacing8}>
        {t('preview_of_protocol_steps')}
      </StyledText>
      <Divider marginX={`calc(-1 * ${SPACING.spacing16})`} />
      <ViewportList
        viewportRef={viewPortRef}
        ref={ref}
        items={commands}
        onViewportIndexesChange={([
          lowestVisibleIndex,
          highestVisibleIndex,
        ]) => {
          if (currentRunCommandIndex >= 0) {
            setIsCurrentCommandVisible(
              currentRunCommandIndex >= lowestVisibleIndex &&
                currentRunCommandIndex <= highestVisibleIndex
            )
          }
        }}
        initialIndex={currentRunCommandIndex}
      >
        {(command, index) => {
          const isCurrent = index === currentRunCommandIndex
          const backgroundColor = isCurrent ? COLORS.blue30 : COLORS.grey20
          const iconColor = isCurrent ? COLORS.blue60 : COLORS.grey50
          return (
            <Flex
              key={command.id}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing8}
            >
              <StyledText
                minWidth={SPACING.spacing16}
                fontSize={TYPOGRAPHY.fontSizeCaption}
              >
                {index + 1}
              </StyledText>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
                width="100%"
                backgroundColor={
                  index === jumpedIndex ? '#F5E3FF' : backgroundColor
                }
                color={COLORS.black90}
                borderRadius={BORDERS.borderRadius4}
                padding={SPACING.spacing8}
                css={css`
                  transition: background-color ${COLOR_FADE_MS}ms ease-out,
                    border-color ${COLOR_FADE_MS}ms ease-out;
                `}
              >
                <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                  <CommandIcon command={command} color={iconColor} />
                  <CommandText
                    command={command}
                    analysis={robotSideAnalysis}
                    robotType={robotType}
                    color={COLORS.black90}
                  />
                </Flex>
              </Flex>
            </Flex>
          )
        }}
      </ViewportList>
      {currentRunCommandIndex >= 0 ? (
        <PrimaryButton
          position={POSITION_FIXED}
          bottom={SPACING.spacing40}
          left={`calc(calc(100% + ${NAV_BAR_WIDTH})/2)`} // add width of half of nav bar to center within run tab
          transform="translate(-50%)"
          borderRadius={SPACING.spacing32}
          display={isCurrentCommandVisible ? DISPLAY_NONE : DISPLAY_FLEX}
          onClick={makeHandleScrollToStep(currentRunCommandIndex)}
          id="RunLog_jumpToCurrentStep"
        >
          {t('view_current_step')}
        </PrimaryButton>
      ) : null}
      {currentRunCommandIndex === commands.length - 1 ? (
        <StyledText as="h6" color={COLORS.grey60}>
          {t('end_of_protocol')}
        </StyledText>
      ) : null}
    </Flex>
  )
}

export const RunPreview = React.forwardRef(RunPreviewComponent)
