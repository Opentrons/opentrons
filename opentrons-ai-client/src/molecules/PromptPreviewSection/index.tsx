import styled from 'styled-components'
import {
  Flex,
  StyledText,
  COLORS,
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

const TagGrid = styled(Flex)`
  grid-gap: ${SPACING.spacing4};
  flex-wrap: ${WRAP};
  color: ${COLORS.grey60};
`

export function PromptPreviewSection({
  title,
  items,
}: PromptPreviewSectionProps): JSX.Element {
  return (
    <PromptPreviewSectionContainer>
      <SectionHeading desktopStyle="bodyLargeSemiBold">{title}</SectionHeading>
      <TagGrid>
        {items.map((item: string, index: number) =>
          item.trim() === '' ? null : (
            <Tag key={`item-tag-${index}`} text={item} type={'default'} />
          )
        )}
      </TagGrid>
    </PromptPreviewSectionContainer>
  )
}
