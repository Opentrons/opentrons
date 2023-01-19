import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
} from '@opentrons/components'
import { ViewportList, ViewportListRef } from 'react-viewport-list';
import { StyledText } from '../../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { AnalysisStepText } from '../../AnalysisStepText'

const COLOR_FADE_MS = 500
interface AnalyzedStepsProps {
  runId: string,
  jumpedIndex: number | null,
}
export const AnalyzedSteps = React.forwardRef(({ runId, jumpedIndex }: AnalyzedStepsProps, ref: React.ForwardedRef<ViewportListRef>): JSX.Element | null => {
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const viewPortRef = React.useRef<HTMLDivElement | null>(null)

  if (robotSideAnalysis == null) return null

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
      <ViewportList
        viewportRef={viewPortRef}
        ref={ref}
        items={robotSideAnalysis.commands}
      >
        {(command, index) => (
          <Flex
            key={command.id}
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing3}
          >
            <StyledText fontSize={TYPOGRAPHY.fontSizeCaption}>
              {index + 1}
            </StyledText>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing2}
              width="100%"
              border={`solid 1px ${index === jumpedIndex ? COLORS.blueEnabled : COLORS.transparent}`}
              backgroundColor={index === jumpedIndex ? COLORS.lightBlue : COLORS.fundamentalsBackground}
              color={COLORS.darkBlackEnabled}
              borderRadius={BORDERS.radiusSoftCorners}
              padding={SPACING.spacing3}
              css={css`
                transition: background-color ${COLOR_FADE_MS}ms ease-out, border-color ${COLOR_FADE_MS}ms ease-out;
              `}
            >
              <AnalysisStepText command={command} robotSideAnalysis={robotSideAnalysis} />
            </Flex>
          </Flex>
        )}
      </ViewportList>
    </Flex>
  )
})
