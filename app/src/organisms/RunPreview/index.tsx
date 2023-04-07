import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
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
  POSITION_FIXED,
} from '@opentrons/components'
import { ViewportList, ViewportListRef } from 'react-viewport-list'
import { StyledText } from '../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { CommandText } from '../CommandText'
import { Divider } from '../../atoms/structure'
import { NAV_BAR_WIDTH } from '../../App/constants'
import { useLastRunCommandKey } from '../Devices/hooks/useLastRunCommandKey'
import { CommandIcon } from './CommandIcon'

const COLOR_FADE_MS = 500
interface RunPreviewProps {
  runId: string
  jumpedIndex: number | null
  makeHandleScrollToStep: (index: number) => () => void
}
export const RunPreviewComponent = (
  { runId, jumpedIndex, makeHandleScrollToStep }: RunPreviewProps,
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
      gridGap={SPACING.spacing3}
      padding={SPACING.spacing4}
    >
      <Flex gridGap={SPACING.spacing3} alignItems={ALIGN_CENTER}>
        <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('run_preview')}
        </StyledText>
        <StyledText as="label" color={COLORS.darkGreyEnabled}>
          {t('steps_total', { count: robotSideAnalysis.commands.length })}
        </StyledText>
      </Flex>
      <StyledText as="p" marginBottom={SPACING.spacing3}>
        {t('preview_of_protocol_steps')}
      </StyledText>
      <Divider marginX={`calc(-1 * ${SPACING.spacing4})`} />
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
            ? COLORS.blueEnabled
            : COLORS.transparent
          const backgroundColor = isCurrent
            ? COLORS.lightBlue
            : COLORS.fundamentalsBackground
          const contentColor = isCurrent
            ? COLORS.darkBlackEnabled
            : COLORS.darkGreyEnabled
          return (
            <Flex
              key={command.id}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing3}
            >
              <StyledText
                minWidth={SPACING.spacing4}
                fontSize={TYPOGRAPHY.fontSizeCaption}
              >
                {index + 1}
              </StyledText>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing2}
                width="100%"
                border={`solid 1px ${
                  index === jumpedIndex ? COLORS.electricPurple : borderColor
                }`}
                backgroundColor={
                  index === jumpedIndex ? '#F5E3FF' : backgroundColor
                }
                color={COLORS.darkBlackEnabled}
                borderRadius={BORDERS.radiusSoftCorners}
                padding={SPACING.spacing3}
                css={css`
                  transition: background-color ${COLOR_FADE_MS}ms ease-out,
                    border-color ${COLOR_FADE_MS}ms ease-out;
                `}
              >
                <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
                  <CommandIcon command={command} color={contentColor} />
                  <CommandText
                    command={command}
                    robotSideAnalysis={robotSideAnalysis}
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
          bottom={SPACING.spacingXXL}
          left={`calc(calc(100% + ${NAV_BAR_WIDTH})/2)`} // add width of half of nav bar to center within run tab
          transform="translate(-50%)"
          borderRadius={SPACING.spacing6}
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
