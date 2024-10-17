import styled from 'styled-components'
import { Flex, StyledText, LargeButton, COLORS } from '@opentrons/components'
import { PromptPreviewSection, type PromptPreviewSectionProps } from '../PromptPreviewSection'

const PROMPT_PREVIEW_PLACEHOLDER_MESSAGE =
  'As you complete the sections on the left, your prompt will be built here. When all requirements are met you will be able to generate the protocol.'

interface PromptPreviewProps {
  isSubmitButtonEnabled?: boolean
  handleSubmit: () => void
  promptPreviewData: PromptPreviewSectionProps[]
}

const PromptPreviewContainer = styled(Flex)`
  flex-direction: column;
  width: 100%;
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

export function PromptPreview({
  isSubmitButtonEnabled = false,
  handleSubmit,
  promptPreviewData,
}: PromptPreviewProps): JSX.Element {
  const areAllSectionsEmpty = (): boolean => {
    return promptPreviewData.every(section => section.items.length === 0)
  }

  return (
    <PromptPreviewContainer>
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
            <PromptPreviewSection key={`section-${index}`} title={section.title} items={section.items} />
          )
      )}
    </PromptPreviewContainer>
  )
}
