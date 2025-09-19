import React, { Fragment } from 'react'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  StyledText,
  Tag,
  WRAP,
} from '@opentrons/components'

export interface PromptPreviewSectionProps {
  title: string
  items: string[]
  itemMaxWidth?: string
  oneItemPerRow?: boolean
  isStepsSection?: boolean
}

const PromptPreviewSectionContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  margin-top: ${SPACING.spacing32};
`

const SectionHeading = styled(StyledText)`
  margin-bottom: ${SPACING.spacing8};
`

const TagsContainer = styled.div<{
  oneItemPerRow: boolean
}>`
  display: flex;
  grid-gap: ${SPACING.spacing4};
  /* When oneItemPerRow is true, disable wrapping to keep a single column layout */
  flex-wrap: ${props => (props.oneItemPerRow ? 'NO_WRAP' : WRAP)};
  justify-content: flex-start;
  width: 100%;
  flex-direction: ${props =>
    props.oneItemPerRow ? DIRECTION_COLUMN : DIRECTION_ROW};
`

const TagItemWrapper = styled.div<{
  itemMaxWidth: string
}>`
  display: flex;
  width: auto;
  max-width: ${props => props.itemMaxWidth};

  & > div {
    overflow: visible;
    width: 100%;
    max-width: 100%;

    > p {
      overflow: visible;
      white-space: pre-wrap !important;
      word-wrap: break-word;
      word-break: break-word;
      width: 100%;
    }
  }
`

// Special wrapper for the line break item
const LineBreakWrapper = styled.div`
  width: 100%;
  flex-basis: 100%;
  height: 0;
`

// Custom styled component that mimics a Tag but handles newlines
const StepTag = styled.div`
  background-color: ${COLORS.black90}${COLORS.opacity20HexCode};
  color: ${COLORS.black90};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing2} ${SPACING.spacing8};
  width: 100%;
  font-size: 0.875rem;
`

// Component to handle multiline steps
const StepTagContent = ({ text }: { text: string }): JSX.Element => {
  // Split by newlines and display each line properly
  return (
    <StepTag>
      {text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </StepTag>
  )
}

export function PromptPreviewSection({
  title,
  items,
  itemMaxWidth = '35%',
  oneItemPerRow = false,
  isStepsSection = false,
}: PromptPreviewSectionProps): JSX.Element {
  // If this is the Steps section, render each step in its own row
  if (isStepsSection) {
    return (
      <PromptPreviewSectionContainer>
        <SectionHeading desktopStyle="bodyLargeSemiBold">
          {title}
        </SectionHeading>
        <Flex flexDirection="column" gridGap={SPACING.spacing4} width="100%">
          {items.map((item: string, index: number) => (
            <StepTagContent key={`step-${index}`} text={item} />
          ))}
        </Flex>
      </PromptPreviewSectionContainer>
    )
  }

  const stackItems = oneItemPerRow || isStepsSection
  return (
    <PromptPreviewSectionContainer>
      <SectionHeading desktopStyle="bodyLargeSemiBold">{title}</SectionHeading>
      <TagsContainer oneItemPerRow={stackItems}>
        {items.map((item: string, index: number) => {
          // Handle the special line break item that separates labware from liquids
          if (item === '__LINE_BREAK__') {
            return <LineBreakWrapper key={`line-break-${index}`} />
          }

          // Skip empty strings
          if (item.trim() === '') return null

          // Render each tag, forcing a break for stacked layouts
          return (
            <Fragment key={`item-row-${index}`}>
              <TagItemWrapper
                data-testid={`item-tag-wrapper-${index}`}
                itemMaxWidth={itemMaxWidth}
              >
                {isStepsSection ? (
                  <StepTagContent text={item} />
                ) : (
                  <Tag text={item} type="default" />
                )}
              </TagItemWrapper>
              {stackItems ? <LineBreakWrapper /> : null}
            </Fragment>
          )
        })}
      </TagsContainer>
    </PromptPreviewSectionContainer>
  )
}
