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

  function displayCheckmark(stepNumber: number): boolean {
    return currentStep > stepNumber && focusStep !== stepNumber
  }

  return (
    <ProtocolSections>
      {[
        {
          stepNumber: APPLICATION_STEP,
          title: 'application_title',
          Component: ApplicationSection,
        },
        {
          stepNumber: INSTRUMENTS_STEP,
          title: 'instruments_title',
          Component: () => <Flex>Content</Flex>,
        },
        {
          stepNumber: MODULES_STEP,
          title: 'modules_title',
          Component: () => <Flex>Content</Flex>,
        },
        {
          stepNumber: LABWARE_LIQUIDS_STEP,
          title: 'labware_liquids_title',
          Component: () => <Flex>Content</Flex>,
        },
        {
          stepNumber: STEPS_STEP,
          title: 'steps_title',
          Component: () => <Flex>Content</Flex>,
        },
      ].map(({ stepNumber, title, Component }) => (
        <Accordion
          key={stepNumber}
          heading={t(title)}
          isOpen={focusStep === stepNumber}
          handleClick={() => {
            handleSectionClick(stepNumber)
          }}
          isCompleted={displayCheckmark(stepNumber)}
        >
          <Component />
        </Accordion>
      ))}
    </ProtocolSections>
  )
}

const ProtocolSections = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
  gap: ${SPACING.spacing16};
`
