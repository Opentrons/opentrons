import styled from 'styled-components'
import { Flex, StyledText, COLORS, Tag } from '@opentrons/components'

export interface PromptPreviewSectionProps {
  title: string
  items: string[]
}

const PromptPreviewSectionContainer = styled(Flex)`
  flex-direction: column;
  margin-top: 32px;
`

const SectionHeading = styled(StyledText)`
  margin-bottom: 8px;
`

const TagGrid = styled(Flex)`
  grid-gap: 4px;
  flex-wrap: wrap;
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
        {items.map((item: string, index: number) => (
          <Tag key={`tag-${index}`} text={item} type={'default'} />
        ))}
      </TagGrid>
    </PromptPreviewSectionContainer>
  )
}
