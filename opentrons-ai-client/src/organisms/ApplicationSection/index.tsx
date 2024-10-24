import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_FLEX_END,
  LargeButton,
  SPACING,
} from '@opentrons/components'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ControlledDropdownMenu } from '../../atoms/ControlledDropdownMenu'
import { ControlledInputField } from '../../atoms/ControlledInputField'
import { useAtom } from 'jotai'
import { createProtocolAtom } from '../../resources/atoms'
import { APPLICATION_STEP } from '../ProtocolSectionsContainer'

export const BASIC_ALIQUOTING = 'basic_aliquoting'
export const PCR = 'pcr'
export const OTHER = 'other'
export const APPLICATION_SCIENTIFIC_APPLICATION =
  'application.scientificApplication'
export const APPLICATION_OTHER_APPLICATION = 'application.otherApplication'
export const APPLICATION_DESCRIBE = 'application.description'

export function ApplicationSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    watch,
    formState: { isValid },
  } = useFormContext()
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)

  const options = [
    { name: t(BASIC_ALIQUOTING), value: BASIC_ALIQUOTING },
    { name: t(PCR), value: PCR },
    { name: t(OTHER), value: OTHER },
  ]

  const isOtherSelected = watch(APPLICATION_SCIENTIFIC_APPLICATION) === OTHER

  function handleConfirmButtonClick(): void {
    const step =
      currentStep > APPLICATION_STEP ? currentStep : APPLICATION_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing16}
    >
      <ControlledDropdownMenu
        width="100%"
        dropdownType="neutral"
        name={APPLICATION_SCIENTIFIC_APPLICATION}
        title={t('application_scientific_dropdown_title')}
        options={options}
        placeholder={t('application_scientific_dropdown_placeholder')}
        rules={{ required: true }}
      />

      {isOtherSelected && (
        <ControlledInputField
          name={APPLICATION_OTHER_APPLICATION}
          title={t('application_other_title')}
          caption={t('application_other_caption')}
          rules={{ required: isOtherSelected, minLength: 3 }}
        />
      )}

      <ControlledInputField
        name={APPLICATION_DESCRIBE}
        title={t('application_describe_title')}
        caption={t('application_describe_caption')}
        rules={{ required: true, minLength: 3 }}
      />

      <ButtonContainer>
        <LargeButton
          onClick={handleConfirmButtonClick}
          disabled={!isValid}
          buttonText={t('section_confirm_button')}
        ></LargeButton>
      </ButtonContainer>
    </Flex>
  )
}

const ButtonContainer = styled.div`
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_FLEX_END};
`
