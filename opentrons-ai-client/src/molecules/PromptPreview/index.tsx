import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  SIZE_AUTO,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { PromptPreviewSection } from '../PromptPreviewSection'

import type { PromptPreviewSectionProps } from '../PromptPreviewSection'

const LABWARE_LIQUIDS_SECTION_INDEX = 4
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
  width: 100%;
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
  const { t } = useTranslation('protocol_generator')

  // Compute the index of the steps section (always last)
  const lastSectionIndex = promptPreviewData.length - 1

  const areAllSectionsEmpty = (): boolean => {
    return promptPreviewData.every(section => section.items.length === 0)
  }

  return (
    <PromptPreviewContainer>
      <PromptPreviewHeading>
        <StyledText desktopStyle="headingLargeBold">Prompt</StyledText>
        <LargeButton
          buttonText={t('prompt_preview_submit_button')}
          disabled={!isSubmitButtonEnabled}
          onClick={handleSubmit}
        />
      </PromptPreviewHeading>

      {areAllSectionsEmpty() && (
        <PromptPreviewPlaceholderMessage desktopStyle="headingSmallRegular">
          {t('prompt_preview_placeholder_message')}
        </PromptPreviewPlaceholderMessage>
      )}

      {Object.values(promptPreviewData).map((section, index) => {
        const isLabwareLiquidsSection = index === LABWARE_LIQUIDS_SECTION_INDEX
        const isStepsSection = index === lastSectionIndex
        return (
          section.items.length > 0 && (
            <PromptPreviewSection
              key={`section-${index}`}
              title={section.title}
              items={section.items}
              itemMaxWidth={index === 1 ? '50%' : '100%'}
              oneItemPerRow={isLabwareLiquidsSection}
              isStepsSection={isStepsSection}
            />
          )
        )
      })}
    </PromptPreviewContainer>
  )
}
