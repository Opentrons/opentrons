import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next';
import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
  Icon,
  IconName,
} from '@opentrons/components'
import { ViewportList, ViewportListRef } from 'react-viewport-list';
import { StyledText } from '../../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { AnalysisStepText } from '../../AnalysisStepText'
import { Divider } from '../../../atoms/structure';

const ICON_BY_COMMAND_TYPE: { [commandType: string]: IconName } = {
  'pause': 'pause-circle',
  'waitForResume': 'pause-circle',
}
const COLOR_FADE_MS = 500
interface AnalyzedStepsProps {
  runId: string,
  jumpedIndex: number | null,
}
export const AnalyzedSteps = React.forwardRef(({ runId, jumpedIndex }: AnalyzedStepsProps, ref: React.ForwardedRef<ViewportListRef>): JSX.Element | null => {
  const { t } = useTranslation('run_details')
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
      <Flex gridGap={SPACING.spacing3} alignItems={ALIGN_CENTER}>
        <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('run_preview')}
        </StyledText>
        <StyledText as="label" color={COLORS.darkGreyEnabled}>{t('steps_total', {count: robotSideAnalysis.commands.length})}</StyledText>
      </Flex>
      <StyledText as="p" marginBottom={SPACING.spacing3}>{t('preview_of_protocol_steps')}</StyledText>
      <Divider marginX={`calc(-1 * ${SPACING.spacing4})`} />
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
            <StyledText minWidth={SPACING.spacing4} fontSize={TYPOGRAPHY.fontSizeCaption}>
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
              <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>

                {command.commandType in ICON_BY_COMMAND_TYPE ? <Icon name={ICON_BY_COMMAND_TYPE[command.commandType]} size={SPACING.spacingM} flex="0 0 auto" /> : null}
                <AnalysisStepText command={command} robotSideAnalysis={robotSideAnalysis} />
              </Flex>
            </Flex>
          </Flex>
        )}
      </ViewportList>
    </Flex>
  )
})
