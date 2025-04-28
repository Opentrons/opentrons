import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_FLEX_END,
  LargeButton,
  SPACING,
} from '@opentrons/components'
import { COLUMN } from '@opentrons/shared-data'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Accordion } from '../../molecules/Accordion'
import { ApplicationSection } from '../../organisms/ApplicationSection'
import { createProtocolAtom } from '../../resources/atoms'
import { InstrumentsSection } from '../InstrumentsSection'
import { LabwareLiquidsSection } from '../LabwareLiquidsSection'
import { ModulesSection } from '../ModulesSection'
import { ProtocolFormatSection } from '../ProtocolFormatSection'
import { StepsSection } from '../StepsSection'

export const PROTOCOL_FORMAT_STEP = 0
export const APPLICATION_STEP = 1
export const INSTRUMENTS_STEP = 2
export const MODULES_STEP = 3
export const LABWARE_LIQUIDS_STEP = 4
export const STEPS_STEP = 5

export const sections = [
  {
    sectionNumber: PROTOCOL_FORMAT_STEP,
    title: 'protocol_format_title',
    Component: ProtocolFormatSection,
  },
  {
    sectionNumber: APPLICATION_STEP,
    title: 'application_title',
    Component: ApplicationSection,
  },
  {
    sectionNumber: INSTRUMENTS_STEP,
    title: 'instruments_title',
    Component: InstrumentsSection,
  },
  {
    sectionNumber: MODULES_STEP,
    title: 'modules_title',
    Component: ModulesSection,
  },
  {
    sectionNumber: LABWARE_LIQUIDS_STEP,
    title: 'labware_liquids_title',
    Component: LabwareLiquidsSection,
  },
  {
    sectionNumber: STEPS_STEP,
    title: 'steps_title',
    Component: StepsSection,
  },
]

export function ProtocolSectionsContainer(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    trigger,
  } = useFormContext()
  const [{ currentSection, focusSection }, setCreateProtocolAtom] = useAtom(
    createProtocolAtom
  )

  useEffect(() => {
    trigger()
  }, [focusSection])

  function handleSectionClick(stepNumber: number): void {
    currentSection >= stepNumber &&
      setCreateProtocolAtom({
        currentSection: stepNumber,
        focusSection: stepNumber,
      })
  }

  function displayCheckmark(stepNumber: number): boolean {
    return currentSection > stepNumber && focusSection !== stepNumber
  }

  function handleConfirmButtonClick(): void {
    const step =
      currentSection > focusSection ? currentSection : focusSection + 1

    setCreateProtocolAtom({
      currentSection: step,
      focusSection: step,
    })
  }

  return (
    <ProtocolSections>
      {sections.map(({ sectionNumber, title, Component }) => (
        <Accordion
          key={sectionNumber}
          heading={t(title)}
          isOpen={focusSection === sectionNumber}
          handleClick={() => {
            handleSectionClick(sectionNumber)
          }}
          isCompleted={displayCheckmark(sectionNumber)}
        >
          {focusSection === sectionNumber && (
            <Flex flexDirection={COLUMN} gap={SPACING.spacing16}>
              <Component />
              <ButtonContainer>
                <LargeButton
                  onClick={handleConfirmButtonClick}
                  disabled={!isValid}
                  buttonText={t('section_confirm_button')}
                ></LargeButton>
              </ButtonContainer>
            </Flex>
          )}
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

const ButtonContainer = styled.div`
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_FLEX_END};
`
