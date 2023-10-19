import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import difference from 'lodash/difference'
import { ALIGN_CENTER, DIRECTION_COLUMN, Flex, Icon, SPACING } from '@opentrons/components'
import { ProtocolAnalysisOutput, RunTimeCommand } from '@opentrons/shared-data'
import { CommandText } from '../CommandText'
import { StyledText } from '../../atoms/text'

interface AnnotatedStepsProps {
  analysis: ProtocolAnalysisOutput | null
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
  const groupedCommands = analysis.commands.reduce((acc, c) => {
    const foundAnnotationIndex = annotations.findIndex(a => a.commandIds.includes(c.key))
    console.log('annotations', annotations)
    console.log('foundAnnotationIndex', foundAnnotationIndex)
    if (
      acc.length > 0
      && acc[acc.length - 1]?.annotationIndex != null
      && annotations[acc[acc.length - 1]?.annotationIndex]?.commandIds.includes(c.key)
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
  console.log(groupedCommands)

  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="25rem"
      overflowY="auto"
    >
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        {groupedCommands.map(c =>
          c.annotationIndex != null ? (
            <AnnotatedGroup analysis={analysis} annotationType={annotations[c.annotationIndex]?.annotationType} subCommands={c.subCommands} />
          ) : (
            <CommandText key={c.id} robotSideAnalysis={analysis} command={c} />
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
                {subCommands.map(c => (
                  <CommandText key={c.id} robotSideAnalysis={analysis} command={c} />
                ))}
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

