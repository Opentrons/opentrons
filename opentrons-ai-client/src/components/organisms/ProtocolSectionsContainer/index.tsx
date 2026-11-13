import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import styled from 'styled-components'

import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_FLEX_END,
  LargeButton,
  SPACING,
} from '@opentrons/components'
import { COLUMN } from '@opentrons/shared-data'

import { Accordion } from '/ai-client/components/molecules/Accordion'
import { ApplicationSection } from '/ai-client/components/organisms/ApplicationSection'
import { createProtocolAtom } from '/ai-client/resources/atoms'

import {
  InstrumentsSection,
  OPENTRONS_FLEX,
  ROBOT_FIELD_NAME,
} from '../InstrumentsSection'
import { LabwareLiquidsSection } from '../LabwareLiquidsSection'
import { ModulesAndFixturesSection } from '../ModulesAndFixturesSection'
import { RuntimeParametersSection } from '../RuntimeParametersSection'
import { StepsSection } from '../StepsSection'

const APPLICATION_SECTION = 0
const INSTRUMENTS_SECTION = 1
const MODULES_SECTION = 2
const LABWARE_LIQUIDS_SECTION = 3
const RUNTIME_PARAMETERS_SECTION = 4
const STEPS_SECTION = 5

export const TOTAL_STEPS = 6

export function ProtocolSectionsContainer(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    trigger,
    watch,
  } = useFormContext()
  const [{ currentSection, focusSection }, setCreateProtocolAtom] =
    useAtom(createProtocolAtom)

  const robotType: string = watch(ROBOT_FIELD_NAME)

  const sections = [
    {
      sectionNumber: APPLICATION_SECTION,
      title: 'application_title',
      Component: ApplicationSection,
    },
    {
      sectionNumber: INSTRUMENTS_SECTION,
      title: 'instruments_title',
      Component: InstrumentsSection,
    },
    {
      sectionNumber: MODULES_SECTION,
      title:
        robotType === OPENTRONS_FLEX
          ? 'modules_fixtures_title'
          : 'modules_title',
      Component: ModulesAndFixturesSection,
    },
    {
      sectionNumber: LABWARE_LIQUIDS_SECTION,
      title: 'labware_liquids_title',
      Component: LabwareLiquidsSection,
    },
    {
      sectionNumber: RUNTIME_PARAMETERS_SECTION,
      title: 'runtime_parameters_title',
      Component: RuntimeParametersSection,
    },
    {
      sectionNumber: STEPS_SECTION,
      title: 'steps_title',
      Component: StepsSection,
    },
  ]

  useEffect(
    () => {
      trigger()
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusSection]
  )

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
