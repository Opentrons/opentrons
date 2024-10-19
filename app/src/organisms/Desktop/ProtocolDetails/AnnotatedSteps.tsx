import { useMemo } from 'react'
import { css } from 'styled-components'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  OVERFLOW_AUTO,
} from '@opentrons/components'

import { CommandIcon, CommandText } from '/app/molecules/Command'
import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RunTimeCommand,
  LabwareDefinition2,
} from '@opentrons/shared-data'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  currentCommandIndex?: number
}

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const { analysis, currentCommandIndex } = props
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `

  const isValidRobotSideAnalysis = analysis != null
  const allRunDefs = useMemo(
    () =>
      analysis != null
        ? getLabwareDefinitionsFromCommands(analysis.commands)
        : [],
    [isValidRobotSideAnalysis]
  )

  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="82vh"
      flex="1 1 0"
      overflowY={OVERFLOW_AUTO}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginY={SPACING.spacing16}
        gridGap={SPACING.spacing4}
      >
        {analysis.commands.map((c, i) => (
          <IndividualCommand
            key={i}
            stepNumber={(i + 1).toString()}
            command={c}
            isHighlighted={i === currentCommandIndex}
            analysis={analysis}
            allRunDefs={allRunDefs}
          />
        ))}
      </Flex>
    </Flex>
  )
}

interface IndividualCommandProps {
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  stepNumber: string
  isHighlighted: boolean
  allRunDefs: LabwareDefinition2[]
}
function IndividualCommand({
  command,
  analysis,
  stepNumber,
  isHighlighted,
  allRunDefs,
}: IndividualCommandProps): JSX.Element {
  const backgroundColor = isHighlighted ? COLORS.blue30 : COLORS.grey20
  const iconColor = isHighlighted ? COLORS.blue60 : COLORS.grey50
  return (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
      <LegacyStyledText
        minWidth={SPACING.spacing16}
        fontSize={TYPOGRAPHY.fontSizeCaption}
      >
        {stepNumber}
      </LegacyStyledText>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
        backgroundColor={backgroundColor}
        color={COLORS.black90}
        borderRadius={BORDERS.borderRadius4}
        padding={SPACING.spacing8}
        css={css`
          transition: background-color 500ms ease-out,
            border-color 500ms ease-out;
        `}
      >
        <Flex
          key={command.id}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
        >
          <CommandIcon command={command} color={iconColor} />
          <CommandText
            command={command}
            robotType={analysis?.robotType ?? FLEX_ROBOT_TYPE}
            color={COLORS.black90}
            commandTextData={analysis}
            allRunDefs={allRunDefs}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
