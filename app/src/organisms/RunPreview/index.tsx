import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ViewportList, ViewportListRef } from 'react-viewport-list'

import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DISPLAY_NONE,
  SPACING,
  PrimaryButton,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
  LEGACY_COLORS,
  POSITION_FIXED,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { CommandText } from '../CommandText'
import { Divider } from '../../atoms/structure'
import { NAV_BAR_WIDTH } from '../../App/constants'
import { useLastRunCommandKey } from '../Devices/hooks/useLastRunCommandKey'
import { CommandIcon } from './CommandIcon'
import type { RobotType } from '@opentrons/shared-data'

const COLOR_FADE_MS = 500
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
  const viewPortRef = React.useRef<HTMLDivElement | null>(null)
  const currentRunCommandKey = useLastRunCommandKey(runId)
  const [
    isCurrentCommandVisible,
    setIsCurrentCommandVisible,
  ] = React.useState<boolean>(true)
  if (robotSideAnalysis == null) return null
  const currentRunCommandIndex = robotSideAnalysis.commands.findIndex(
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
          {t('steps_total', { count: robotSideAnalysis.commands.length })}
        </StyledText>
      </Flex>
      <StyledText as="p" marginBottom={SPACING.spacing8}>
        {t('preview_of_protocol_steps')}
      </StyledText>
      <Divider marginX={`calc(-1 * ${SPACING.spacing16})`} />
      <ViewportList
        viewportRef={viewPortRef}
        ref={ref}
        items={robotSideAnalysis.commands}
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
          const borderColor = isCurrent
            ? COLORS.blue50
            : COLORS.transparent
          const backgroundColor = isCurrent
            ? COLORS.blue10
            : COLORS.grey10
          const contentColor = isCurrent
            ? COLORS.black90
            : COLORS.grey50
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
                border={`solid 1px ${
                  index === jumpedIndex
                    ? LEGACY_COLORS.electricPurple
                    : borderColor
                }`}
                backgroundColor={
                  index === jumpedIndex ? '#F5E3FF' : backgroundColor
                }
                color={COLORS.black90}
                borderRadius={BORDERS.radiusSoftCorners}
                padding={SPACING.spacing8}
                css={css`
                  transition: background-color ${COLOR_FADE_MS}ms ease-out,
                    border-color ${COLOR_FADE_MS}ms ease-out;
                `}
              >
                <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                  <CommandIcon command={command} color={contentColor} />
                  <CommandText
                    command={command}
                    robotSideAnalysis={robotSideAnalysis}
                    robotType={robotType}
                    color={contentColor}
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
    </Flex>
  )
}

export const RunPreview = React.forwardRef(RunPreviewComponent)
