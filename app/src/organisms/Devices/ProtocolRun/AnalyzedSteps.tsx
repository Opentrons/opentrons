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
import { ViewportList } from 'react-viewport-list';
import { StyledText } from '../../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { AnalysisStepText } from '../../AnalysisStepText'
import { PrimaryButton } from '../../../atoms/buttons'

interface RunLogProps {
  runId: string,
}

export function AnalyzedSteps({ runId }: RunLogProps): JSX.Element | null {
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)

  const [selectedCommandType, setSelectedCommandType]= React.useState('')
  const viewPortRef = React.useRef<HTMLDivElement | null>(null)
  const commandIdRefs = React.useRef([])

  if (robotSideAnalysis == null) return null

  const handleJumpToCommandId = (commandId: string) => {
    const el = document.getElementById(`commandNode_${commandId}`)
    el?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <>
      <svg width="100%" height="40px" viewBox={`0 0 ${robotSideAnalysis.commands.length} 40`}>
        <rect color="teal" x="0" y="10" height="20" width={robotSideAnalysis.commands.length}/>
        <rect color="rebeccapurple" x="0" y="10" height="20" width={robotSideAnalysis.commands.length/2}/>
      </svg>
      <PrimaryButton onClick={() => handleJumpToCommandId("command.PAUSE-0")}>JUMP TO EARLIER COMMAND</PrimaryButton>
      <PrimaryButton onClick={() => handleJumpToCommandId("command.COMMENT-1")}>JUMP TO LATER COMMAND</PrimaryButton>
      <input type="text" onChange={(e) => setSelectedCommandType(e.target.value)} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        height="30rem"
        width="100%"
        overflowY="scroll"
        gridGap={SPACING.spacing3}
        padding={SPACING.spacing4}
      >
        <ViewportList
        viewportRef={viewPortRef}
        items={robotSideAnalysis.commands}
        >
          {(command, index) => (
          <Flex
            key={command.id}
            id={`commandNode_${command.id}`}
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
          )}
        </ViewportList>
        
      </Flex>
    </>
  )

}
