import styled from 'styled-components'
import {
  Flex,
  StyledText,
  LargeButton,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SIZE_AUTO,
  DIRECTION_ROW,
  ALIGN_CENTER,
  SPACING,
} from '@opentrons/components'
import { PromptPreviewSection } from '../PromptPreviewSection'
import type { PromptPreviewSectionProps } from '../PromptPreviewSection'

export const PROMPT_PREVIEW_PLACEHOLDER_MESSAGE =
  'As you complete the sections on the left, your prompt will be built here. When all requirements are met you will be able to generate the protocol.'

interface PromptPreviewProps {
  isSubmitButtonEnabled?: boolean
  handleSubmit: () => void
  promptPreviewData: PromptPreviewSectionProps[]
}

const PromptPreviewContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
  height: ${SIZE_AUTO};
  padding-top: ${SPACING.spacing8};
  background-color: ${COLORS.transparent};
`

const PromptPreviewHeading = styled(Flex)`
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  margin-bottom: ${SPACING.spacing16};
`

const PromptPreviewPlaceholderMessage = styled(StyledText)`
  padding: 82px 73px;
  color: ${COLORS.grey60};
  text-align: ${ALIGN_CENTER};
`

export function PromptPreview({
  isSubmitButtonEnabled = false,
  handleSubmit,
  promptPreviewData = [],
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
            <PromptPreviewSection
              key={`section-${index}`}
              title={section.title}
              items={section.items}
            />
          )
      )}
    </PromptPreviewContainer>
  )
}
