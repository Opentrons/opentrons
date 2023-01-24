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
  TYPOGRAPHY,
  BORDERS,
  COLORS,
  Icon,
  IconName,
  POSITION_FIXED,
  SIZE_1,
} from '@opentrons/components'
import { ViewportList, ViewportListRef } from 'react-viewport-list'
import { PrimaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { AnalysisStepText } from '../../AnalysisStepText'
import { Divider } from '../../../atoms/structure'
import { NAV_BAR_WIDTH } from '../../../App/constants'
import { useCurrentRunCommandKey } from '../hooks/useCurrentRunCommandKey'

const ICON_BY_COMMAND_TYPE: { [commandType: string]: IconName } = {
  pause: 'pause-circle',
  waitForResume: 'pause-circle',
}
const COLOR_FADE_MS = 500
interface AnalyzedStepsProps {
  runId: string
  jumpedIndex: number | null
  makeHandleJumpToStep: (index: number) => () => void
}
export const AnalyzedSteps = React.forwardRef(
  (
    { runId, jumpedIndex, makeHandleJumpToStep }: AnalyzedStepsProps,
    ref: React.ForwardedRef<ViewportListRef>
  ): JSX.Element | null => {
    const { t } = useTranslation('run_details')
    const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
    const viewPortRef = React.useRef<HTMLDivElement | null>(null)
    const currentRunCommandKey = useCurrentRunCommandKey(runId)
    // -1 -> current earlier than visible commands
    //  0 -> current within visible commands
    //  1 -> current later than visible commands
    const [
      currentCommandDirection,
      setCurrentCommandDirection,
    ] = React.useState<-1 | 0 | 1>(0)

    if (robotSideAnalysis == null) return null
    const currentRunCommandIndex =
      robotSideAnalysis.commands.findIndex(
        c => c.key === currentRunCommandKey
      ) ?? 0

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
          onViewportIndexesChange={visibleIndices => {
            if (currentRunCommandIndex >= 0) {
              if (visibleIndices[0] > currentRunCommandIndex) {
                setCurrentCommandDirection(-1)
              } else if (visibleIndices[1] > currentRunCommandIndex) {
                setCurrentCommandDirection(0)
              } else {
                setCurrentCommandDirection(1)
              }
            }
          }}
          initialIndex={currentRunCommandIndex}
        >
          {(command, index) => (
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
                  index === jumpedIndex
                    ? COLORS.blueEnabled
                    : COLORS.transparent
                }`}
                backgroundColor={
                  index === jumpedIndex
                    ? COLORS.lightBlue
                    : COLORS.fundamentalsBackground
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
                  {command.commandType in ICON_BY_COMMAND_TYPE ? (
                    <Icon
                      name={ICON_BY_COMMAND_TYPE[command.commandType]}
                      size={SPACING.spacingM}
                      flex="0 0 auto"
                    />
                  ) : null}
                  <AnalysisStepText
                    command={command}
                    robotSideAnalysis={robotSideAnalysis}
                  />
                </Flex>
              </Flex>
            </Flex>
          )}
        </ViewportList>
        <PrimaryButton
          position={POSITION_FIXED}
          bottom={SPACING.spacingXXL}
          left={`calc(calc(100% + ${NAV_BAR_WIDTH})/2)`} // add width of half of nav bar to center within run tab
          transform="translate(-50%)"
          borderRadius={SPACING.spacing6}
          display={currentCommandDirection !== 0 ? DISPLAY_FLEX : DISPLAY_NONE}
          onClick={makeHandleJumpToStep(currentRunCommandIndex)}
          id="RunLog_jumpToCurrentStep"
        >
          <Icon
            name={currentCommandDirection > 0 ? 'ot-arrow-down' : 'ot-arrow-up'}
            size={SIZE_1}
            marginRight={SPACING.spacing3}
          />
          {t('jump_to_current_step')}
        </PrimaryButton>
      </Flex>
    )
  }
)
