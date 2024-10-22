import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DropdownMenu,
  Flex,
  InputField,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_EVENLY,
  LargeButton,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { Accordion } from '../../molecules/Accordion'
import { useState } from 'react'
import styled from 'styled-components'
import { PromptPreview } from '../../molecules/PromptPreview'

export interface InputType {
  userPrompt: string
}

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [applicationAccordionIsOpen, setApplicationAccordionIsOpen] = useState(
    true
  )

  return (
    <Flex
      position={POSITION_RELATIVE}
      justifyContent={JUSTIFY_SPACE_EVENLY}
      gap={SPACING.spacing32}
      margin={`${SPACING.spacing16} ${SPACING.spacing16}`}
      height="100%"
    >
      <ProtocolSections>
        <Accordion
          heading={t('application_title')}
          isOpen={applicationAccordionIsOpen}
          handleClick={function (): void {
            throw new Error('Function not implemented.')
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} height="100%">
            <FormField>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('application_scientific_dropdown_label')}
              </StyledText>
              <DropdownMenu
                width="100%"
                dropdownType="neutral"
                filterOptions={[
                  { name: 'test', value: 'test' },
                  { name: 'test2', value: 'test2' },
                ]}
                onClick={function (value: string): void {
                  throw new Error('Function not implemented.')
                }}
                currentOption={{ name: 'test', value: 'test' }}
              ></DropdownMenu>
            </FormField>

            <FormField>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('application_describe_label')}
              </StyledText>
              <InputField></InputField>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('application_describe_example')}
              </StyledText>
            </FormField>

            <ButtonContainer>
              <LargeButton
                disabled={true}
                buttonText={t('section_confirm_button')}
              ></LargeButton>
            </ButtonContainer>
          </Flex>
        </Accordion>
      </ProtocolSections>
      <PromptPreview
        handleSubmit={function (): void {
          throw new Error('Function not implemented.')
        }}
        promptPreviewData={[]}
      />
    </Flex>
  )
}

const ProtocolSections = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
`

const ButtonContainer = styled.div`
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_FLEX_END};
`

const FormField = styled.div`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing4};
  margin-bottom: ${SPACING.spacing16};
`
