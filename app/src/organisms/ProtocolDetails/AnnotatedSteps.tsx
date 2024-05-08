import * as React from 'react'
import { css } from 'styled-components'
import { ALIGN_CENTER, ALIGN_FLEX_START, BORDERS, COLORS, DIRECTION_COLUMN, Flex, Icon, SPACING, StyledText, TYPOGRAPHY } from '@opentrons/components'
import { CommandText } from '../CommandText'
import { CommandIcon } from '../RunPreview/CommandIcon'

import { FLEX_ROBOT_TYPE, type CompletedProtocolAnalysis, type ProtocolAnalysisOutput, type RunTimeCommand } from '@opentrons/shared-data'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  currentCommandIndex?: number
}

interface ParentNode {
  annotationIndex: number
  subCommands: LeafNode[]
  isHighlighted: boolean
}
interface LeafNode {
  command: RunTimeCommand
  isHighlighted: boolean
}

export const AnnotatedSteps = (
  props: AnnotatedStepsProps
): JSX.Element => {
  const { analysis, currentCommandIndex } = props
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  const annotations = analysis.commandAnnotations ?? []
  const groupedCommands = analysis.commands.reduce<Array<LeafNode | ParentNode>>((acc, c, i) => {
    const foundAnnotationIndex = annotations.findIndex(a => c.key != null && a.commandKeys.includes(c.key))
    const lastAccNode = acc[acc.length - 1]
    if (
      acc.length > 0
      && c.key != null
      && 'annotationIndex' in lastAccNode
      && lastAccNode.annotationIndex != null
      && annotations[lastAccNode.annotationIndex]?.commandKeys.includes(c.key)
    ) {
      return [
        ...acc.slice(0, -1),
        {
          ...lastAccNode,
          subCommands: [...lastAccNode.subCommands, { command: c, isHighlighted: i === currentCommandIndex }],
          isHighlighted: lastAccNode.isHighlighted || i === currentCommandIndex
        }
      ]
    } else if (foundAnnotationIndex >= 0) {
      return [...acc, { annotationIndex: foundAnnotationIndex, subCommands: [{ command: c, isHighlighted: i === currentCommandIndex }], isHighlighted: i === currentCommandIndex }]
    } else {
      return [...acc, { command: c, isHighlighted: i === currentCommandIndex }]
    }
  }, [])

  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="82vh"
      flex="1 1 0"
      overflowY="auto"
    >
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16} gridGap={SPACING.spacing4}>
        {groupedCommands.map((c, i) =>
          'annotationIndex' in c ? (
            <AnnotatedGroup
              key={i}
              stepNumber={(i + 1).toString()}
              analysis={analysis}
              annotationType={annotations[c.annotationIndex]?.annotationType}
              isHighlighted={c.isHighlighted}
              subCommands={c.subCommands} />
          ) : (
            <IndividualCommand
              key={i}
              stepNumber={(i + 1).toString()}
              command={c.command}
              isHighlighted={c.isHighlighted}
              analysis={analysis} />
          ))}
      </Flex>
    </Flex>
  )
}

interface AnnotatedGroupProps {
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  stepNumber: string
  isHighlighted: boolean
}
function AnnotatedGroup(props: AnnotatedGroupProps): JSX.Element {
  const { subCommands, annotationType, analysis, stepNumber, isHighlighted } = props
  const [isExpanded, setIsExpanded] = React.useState(false)
  const backgroundColor = isHighlighted
    ? COLORS.blue30
    : COLORS.grey20
  return (
    <Flex onClick={() => setIsExpanded(!isExpanded)} cursor="pointer">
      {
        isExpanded
          ? (
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex
                alignItems={ALIGN_CENTER}
                alignSelf={ALIGN_FLEX_START}
                gridGap={SPACING.spacing8}
              >
                <StyledText
                  minWidth={SPACING.spacing16}
                  fontSize={TYPOGRAPHY.fontSizeCaption}
                >
                  {stepNumber}
                </StyledText>
                <Flex
                  alignItems={ALIGN_CENTER}
                  backgroundColor={backgroundColor}
                  color={COLORS.black90}
                  borderRadius={BORDERS.borderRadius4}
                  padding={SPACING.spacing8}
                >
                  <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold} marginLeft={SPACING.spacing8}>{annotationType}</StyledText>
                  <Icon name="chevron-up" size="2rem" />
                </Flex>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} paddingY={SPACING.spacing16} paddingX={SPACING.spacing32} gridGap={SPACING.spacing4}>
                {subCommands.map((c, i) => (
                  <IndividualCommand
                    key={c.command.id}
                    command={c.command}
                    analysis={analysis}
                    isHighlighted={c.isHighlighted}
                    stepNumber={`${stepNumber}.${(i + 1).toString()}`}
                  />
                ))}
              </Flex>
            </Flex>
          ) : (
            <Flex
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing8}
            >
              <StyledText
                minWidth={SPACING.spacing16}
                fontSize={TYPOGRAPHY.fontSizeCaption}
              >
                {stepNumber}
              </StyledText>
              <Flex
                alignItems={ALIGN_CENTER}
                backgroundColor={backgroundColor}
                color={COLORS.black90}
                borderRadius={BORDERS.borderRadius4}
                padding={SPACING.spacing8}
              >
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold} marginLeft={SPACING.spacing8}>{annotationType}</StyledText>
                <Icon name="chevron-down" size="2rem" />
              </Flex>
            </Flex>
          )
      }
    </Flex>
  )
}

interface IndividualCommandProps {
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  stepNumber: string
  isHighlighted: boolean
}
function IndividualCommand(props: IndividualCommandProps): JSX.Element {
  const { command, analysis, stepNumber, isHighlighted } = props
  const backgroundColor = isHighlighted
    ? COLORS.blue30
    : COLORS.grey20
  const iconColor = isHighlighted ? COLORS.blue60 : COLORS.grey50
  return (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
      <StyledText
        minWidth={SPACING.spacing16}
        fontSize={TYPOGRAPHY.fontSizeCaption}
      >
        {stepNumber}
      </StyledText>
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
        <Flex key={command.id} alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <CommandIcon command={command} color={iconColor} />
          <CommandText
            analysis={analysis}
            command={command}
            robotType={analysis?.robotType ?? FLEX_ROBOT_TYPE}
            color={COLORS.black90} />
        </Flex>
      </Flex>
    </Flex>
  )
}

