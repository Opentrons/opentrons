import * as React from 'react'
import { css } from 'styled-components'
import { ALIGN_CENTER, ALIGN_FLEX_START, BORDERS, COLORS, DIRECTION_COLUMN, Flex, Icon, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { ProtocolAnalysisOutput, RunTimeCommand } from '@opentrons/shared-data'
import { CommandText } from '../CommandText'
import { CommandIcon } from '../RunPreview/CommandIcon'
import { StyledText } from '../../atoms/text'

interface AnnotatedStepsProps {
  analysis: ProtocolAnalysisOutput | null
}

interface ParentNode {
  annotationIndex: number
  subCommands: RunTimeCommand[]
}

export const AnnotatedSteps = (
  props: AnnotatedStepsProps
): JSX.Element | null => {
  const { analysis } = props
  if (analysis == null) return null
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  const annotations = analysis.commandAnnotations ?? []
  const groupedCommands = analysis.commands.reduce<Array<RunTimeCommand | ParentNode>>((acc, c) => {
    const foundAnnotationIndex = annotations.findIndex(a => a.commandIds.includes(c.key))
    const lastAccNode = acc[acc.length - 1]
    if (
      acc.length > 0
      && 'annotationIndex' in lastAccNode
      && lastAccNode.annotationIndex != null
      && annotations[lastAccNode.annotationIndex]?.commandIds.includes(c.key)
    ) {
      return [
        ...acc.slice(0, -1),
        {
          ...acc[acc.length - 1],
          subCommands: [...acc[acc.length - 1].subCommands, c]
        }
      ]
    } else if (foundAnnotationIndex >= 0) {
      return [...acc, { annotationIndex: foundAnnotationIndex, subCommands: [c] }]
    } else {
      return [...acc, c]
    }
  }, [])

  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="25rem"
      overflowY="auto"
    >
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16} gridGap={SPACING.spacing4}>
        {groupedCommands.map((c, i) =>
          'annotationIndex' in c && c.annotationIndex != null ? (
            <AnnotatedGroup key={i} stepNumber={(i + 1).toString()} analysis={analysis} annotationType={annotations[c.annotationIndex]?.annotationType} subCommands={c.subCommands} />
          ) : (
            <IndividualCommand key={i} stepNumber={(i + 1).toString()} command={c} analysis={analysis} />
          ))}
      </Flex>
    </Flex>
  )
}

interface AnnotatedGroupProps {
  annotationType: string
  subCommands: RunTimeCommand[]
  analysis: ProtocolAnalysisOutput
  stepNumber: string
}
function AnnotatedGroup(props: AnnotatedGroupProps): JSX.Element {
  const { subCommands, annotationType, analysis, stepNumber } = props
  const [isExpanded, setIsExpanded] = React.useState(false)
  return (
    <Flex onClick={() => setIsExpanded(!isExpanded)} cursor="pointer">
      {
        isExpanded
          ? (
            <>
              <Flex alignItems={ALIGN_CENTER} alignSelf={ALIGN_FLEX_START}>
                <StyledText
                  minWidth={SPACING.spacing16}
                  fontSize={TYPOGRAPHY.fontSizeCaption}
                >
                  {stepNumber}
                </StyledText>
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold} marginLeft={SPACING.spacing8}>{annotationType}</StyledText>
                <Icon name="chevron-up" size="2rem" />
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} paddingY={SPACING.spacing32} gridGap={SPACING.spacing4}>
                {subCommands.map((c, i) => (
                  <IndividualCommand
                  key={c.id}
                  command={c}
                  analysis={analysis}
                  stepNumber={`${stepNumber}.${(i+1).toString()}`}
                   />
                ))}
              </Flex>
            </>
          ) : (
            <Flex alignItems={ALIGN_CENTER}>
              <StyledText
                minWidth={SPACING.spacing16}
                fontSize={TYPOGRAPHY.fontSizeCaption}
              >
                {stepNumber}
              </StyledText>
              <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold} marginLeft={SPACING.spacing8}>{annotationType}</StyledText>
              <Icon name="chevron-down" size="2rem" />
            </Flex>
          )
      }
    </Flex>
  )
}

interface IndividualCommandProps {
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput
  stepNumber: string
}
function IndividualCommand(props: IndividualCommandProps): JSX.Element {
  const { command, analysis, stepNumber } = props
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
        border={`solid 1px ${COLORS.transparent}`}
        backgroundColor={COLORS.fundamentalsBackground}
        color={COLORS.darkBlackEnabled}
        borderRadius={BORDERS.radiusSoftCorners}
        padding={SPACING.spacing8}
      >
        <Flex key={command.id} alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <CommandIcon command={command} />
          <CommandText analysis={analysis} command={command} />
        </Flex>
      </Flex>
    </Flex>
  )
}

