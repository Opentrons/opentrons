import * as React from 'react'
import { css } from 'styled-components'
import { ALIGN_CENTER, BORDERS, COLORS, DIRECTION_COLUMN, Flex, Icon, SPACING, TYPOGRAPHY } from '@opentrons/components'
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
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        {groupedCommands.map((c, i) =>
          'annotationIndex' in c && c.annotationIndex != null ? (
            <AnnotatedGroup key={c.id} analysis={analysis} annotationType={annotations[c.annotationIndex]?.annotationType} subCommands={c.subCommands} />
          ) : (
            <IndividualCommand key={c.id} index={i} command={c} analysis={analysis} />
          ))}
      </Flex>
    </Flex>
  )
}

interface AnnotatedGroupProps {
  annotationType: string
  subCommands: RunTimeCommand[]
  analysis: ProtocolAnalysisOutput
}
function AnnotatedGroup(props: AnnotatedGroupProps): JSX.Element {
  const { subCommands, annotationType, analysis } = props
  const [isExpanded, setIsExpanded] = React.useState(false)
  return (
    <Flex onClick={() => setIsExpanded(!isExpanded)} cursor="pointer">
      {
        isExpanded
          ? (
            <>
              <Flex alignItems={ALIGN_CENTER}>
                <Icon name="chevron-up" size="2rem" />
                <StyledText as="p">{annotationType}</StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing32}>
                {subCommands.map(c => <IndividualCommand key={c.id} command={c} analysis={analysis} />)}
              </Flex>
            </>
          ) : (
            <Flex alignItems={ALIGN_CENTER}>
              <Icon name="chevron-down" size="2rem" />
              <StyledText as="p">{annotationType}</StyledText>
            </Flex>
          )
      }
    </Flex>
  )
}

interface IndividualCommandProps {
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput
  index: number
}
function IndividualCommand(props: IndividualCommandProps): JSX.Element {
  const { command, analysis, index } = props
  return (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
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

