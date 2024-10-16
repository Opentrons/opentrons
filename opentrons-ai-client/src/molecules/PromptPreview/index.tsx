import styled from 'styled-components'
import {
  Flex,
  StyledText,
  LargeButton,
  COLORS,
  Tag,
} from '@opentrons/components'

const PROMPT_PREVIEW_PLACEHOLDER_MESSAGE =
  'As you complete the sections on the left, your prompt will be built here. When all requirements are met you will be able to generate the protocol.'

interface SectionData {
  title: string
  items: string[]
}

interface AccordionProps {
  id?: string
  isSubmitButtonEnabled?: boolean
  handleSubmit: () => void
  promptPreviewData: SectionData[]
}

const PromptPreviewContainer = styled(Flex)`
  flex-direction: column;
  width: 516px;
  height: auto;
  padding-top: 8px;
  background-color: transparent;
`

const PromptPreviewHeading = styled(Flex)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const PromptPreviewPlaceholderMessage = styled(StyledText)`
  padding: 82px 73px;
  color: ${COLORS.grey60};
`

const PromptPreviewSection = styled(Flex)`
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

export function PromptPreview({
  id,
  isSubmitButtonEnabled = false,
  handleSubmit,
  promptPreviewData,
}: AccordionProps): JSX.Element {
  const areAllSectionsEmpty = (): boolean => {
    return promptPreviewData.every(section => section.items.length === 0)
  }

  return (
    <PromptPreviewContainer id={id}>
      <PromptPreviewHeading>
        <StyledText desktopStyle="headingLargeBold">Prompt</StyledText>
        <LargeButton
          buttonText="Submit prompt"
          disabled={!isSubmitButtonEnabled}
          onClick={handleSubmit}
        />
      </PromptPreviewHeading>
      {areAllSectionsEmpty() && (
        <PromptPreviewPlaceholderMessage desktopStyle="headingSmallRegular">
          {PROMPT_PREVIEW_PLACEHOLDER_MESSAGE}
        </PromptPreviewPlaceholderMessage>
      )}

      {Object.values(promptPreviewData).map(
        (section, index) =>
          section.items.length > 0 && (
            <PromptPreviewSection key={`section-${index}`}>
              <SectionHeading desktopStyle="bodyLargeSemiBold">
                {section.title}
              </SectionHeading>
              <TagGrid>
                {section.items.map((item: string, index: number) => (
                  <Tag key={`tag-${index}`} text={item} type={'default'} />
                ))}
              </TagGrid>
            </PromptPreviewSection>
          )
      )}
    </PromptPreviewContainer>
  )
}
