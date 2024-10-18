import styled from 'styled-components'
import {
  Flex,
  StyledText,
  Tag,
  DIRECTION_COLUMN,
  WRAP,
  SPACING,
} from '@opentrons/components'

export interface PromptPreviewSectionProps {
  title: string
  items: string[]
}

const PromptPreviewSectionContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  margin-top: ${SPACING.spacing32};
`

const SectionHeading = styled(StyledText)`
  margin-bottom: ${SPACING.spacing8};
`

const TagsContainer = styled(Flex)`
  grid-gap: ${SPACING.spacing4};
  flex-wrap: ${WRAP};
  justify-content: flex-start;
  width: 100%;
`

const TagItemWrapper = styled(Flex)`
  width: auto;
  white-space: nowrap;
  overflow: hidden;
  max-width: 35%;

  & > div {
    overflow: hidden;

    > p {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`

export function PromptPreviewSection({
  title,
  items,
}: PromptPreviewSectionProps): JSX.Element {
  return (
    <PromptPreviewSectionContainer>
      <SectionHeading desktopStyle="bodyLargeSemiBold">{title}</SectionHeading>
      <TagsContainer>
        {items.map(
          (item: string, index: number) =>
            item.trim() !== '' && (
              <TagItemWrapper key={`item-tag-${index}`}>
                <Tag text={item} type={'default'} />
              </TagItemWrapper>
            )
        )}
      </TagsContainer>
    </PromptPreviewSectionContainer>
  )
}
