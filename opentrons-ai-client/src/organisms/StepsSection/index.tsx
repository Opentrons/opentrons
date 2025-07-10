import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ControlledTextAreaField } from '/ai-client/atoms/ControlledTextAreaField'

export const STEPS_FIELD_NAME = 'steps'

export function StepsSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { trigger } = useFormContext()

  // trigger form validation on mount for when users come back to this section after moving on
  useEffect(() => {
    void trigger([STEPS_FIELD_NAME])
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing16}
    >
      <StyledText color={COLORS.grey60} desktopStyle="headingSmallRegular">
        {t('steps_section_textbody')}
      </StyledText>

      <Flex
        flexDirection={DIRECTION_COLUMN}
        gap={SPACING.spacing4}
        color={COLORS.grey60}
      >
        <ControlledTextAreaField
          name={STEPS_FIELD_NAME}
          height="12.25rem"
          rules={{
            required: true,
          }}
        />
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('paste_from_document_input_caption_1')}
        </StyledText>
        <ExampleOrderedList>
          <li>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('paste_from_document_input_caption_2')}
            </StyledText>
          </li>
          <li>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('paste_from_document_input_caption_3')}
            </StyledText>
          </li>
        </ExampleOrderedList>
      </Flex>
    </Flex>
  )
}

const ExampleOrderedList = styled.ol`
  margin-left: ${SPACING.spacing20};
  font-size: 14px;
`
