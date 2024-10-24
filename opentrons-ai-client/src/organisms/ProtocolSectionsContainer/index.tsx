import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { Accordion } from '../../molecules/Accordion'
import styled from 'styled-components'
import { ApplicationSection } from '../../organisms/ApplicationSection'
import { createProtocolAtom } from '../../resources/atoms'
import { useAtom } from 'jotai'
import { useFormContext } from 'react-hook-form'

export const APPLICATION_STEP = 0
export const INSTRUMENTS_STEP = 1
export const MODULES_STEP = 2
export const LABWARE_LIQUIDS_STEP = 3
export const STEPS_STEP = 4

export function ProtocolSectionsContainer(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
  } = useFormContext()
  const [{ currentStep, focusStep }, setCreateProtocolAtom] = useAtom(
    createProtocolAtom
  )

  function handleSectionClick(stepNumber: number): void {
    currentStep >= stepNumber &&
      isValid &&
      setCreateProtocolAtom({
        currentStep,
        focusStep: stepNumber,
      })
  }

  return (
    <ProtocolSections>
      <Accordion
        heading={t('application_title')}
        isOpen={focusStep === APPLICATION_STEP}
        handleClick={() => {
          handleSectionClick(APPLICATION_STEP)
        }}
        isCompleted={currentStep > APPLICATION_STEP}
      >
        <ApplicationSection />
      </Accordion>

      <Accordion
        heading={t('instruments_title')}
        isOpen={focusStep === INSTRUMENTS_STEP}
        handleClick={() => {
          handleSectionClick(INSTRUMENTS_STEP)
        }}
        isCompleted={currentStep > INSTRUMENTS_STEP}
      >
        <Flex>Content</Flex>
      </Accordion>

      <Accordion
        heading={'Modules'}
        isOpen={focusStep === MODULES_STEP}
        handleClick={() => {
          handleSectionClick(MODULES_STEP)
        }}
        isCompleted={currentStep > MODULES_STEP}
      >
        <Flex>Content</Flex>
      </Accordion>

      <Accordion
        heading={'Labware & Liquids'}
        isOpen={focusStep === LABWARE_LIQUIDS_STEP}
        handleClick={() => {
          handleSectionClick(LABWARE_LIQUIDS_STEP)
        }}
        isCompleted={currentStep > LABWARE_LIQUIDS_STEP}
      >
        <Flex>Content</Flex>
      </Accordion>

      <Accordion
        heading={'Steps'}
        isOpen={focusStep === STEPS_STEP}
        handleClick={() => {
          handleSectionClick(STEPS_STEP)
        }}
        isCompleted={currentStep > STEPS_STEP}
      >
        <Flex>Content</Flex>
      </Accordion>
    </ProtocolSections>
  )
}

const ProtocolSections = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
  gap: ${SPACING.spacing16};
`
