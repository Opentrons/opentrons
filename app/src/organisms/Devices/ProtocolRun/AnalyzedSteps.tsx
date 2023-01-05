import * as React from 'react'

import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/js'
import { AnalysisStepText } from '../../AnalysisStepText'

interface RunLogProps {
  runId: string,
  focusedCommandId: string,
}

export function AnalyzedSteps({ runId, focusedCommandId }: RunLogProps): JSX.Element | null {
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const focusedStepRef = React.useRef<HTMLDivElement>(null)

  if (robotSideAnalysis == null) return null

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="30rem"
      width="100%"
      overflowY="scroll"
      gridGap={SPACING.spacing3}
      padding={SPACING.spacing4}
    >
      {robotSideAnalysis.commands.map((command, index) => (
        <Flex
          key={command.id}
          ref={r => {
            if (command.id === focusedCommandId) focusedStepRef.current = r
          }}
          alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
          <StyledText fontSize={TYPOGRAPHY.fontSizeCaption}>
            {index + 1}
          </StyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing2}
            width="100%"
            border='none'
            backgroundColor={COLORS.fundamentalsBackground}
            color={COLORS.darkBlackEnabled}
            borderRadius={BORDERS.radiusSoftCorners}
            padding={SPACING.spacing3}
          >
            <AnalysisStepText command={command} robotSideAnalysis={robotSideAnalysis} />
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
export interface StepItemProps {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
  stepNumber: number
}

export function StepItem(props: StepItemProps): JSX.Element | null {
  const { command, stepNumber, robotSideAnalysis } = props

  return (
   
  )
}
