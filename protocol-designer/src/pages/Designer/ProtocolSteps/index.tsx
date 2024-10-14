import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  ToggleGroup,
} from '@opentrons/components'
import {
  getSavedStepForms,
  getUnsavedForm,
} from '../../../step-forms/selectors'
import {
  getSelectedStepId,
  getSelectedSubstep,
} from '../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetup'
import { OffDeck } from '../Offdeck'
import { TimelineToolbox, SubstepsToolbox } from './Timeline'
import { StepForm } from './StepForm'
import { StepSummary } from './StepSummary'

export function ProtocolSteps(): JSX.Element {
  const { t } = useTranslation(['starting_deck_state'])
  const formData = useSelector(getUnsavedForm)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const leftString = t('onDeck')
  const rightString = t('offDeck')
  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)

  const formType = formData?.stepType

  useEffect(() => {
    if (formData != null && formType !== 'moveLabware') {
      setDeckView(leftString)
    }
  }, [formData, formType, deckView])

  const currentStepId = useSelector(getSelectedStepId)
  const savedStepForms = useSelector(getSavedStepForms)
  const currentStep =
    currentStepId != null ? savedStepForms[currentStepId] : null

  return (
    <>
      {selectedSubstep ? <SubstepsToolbox stepId={selectedSubstep} /> : null}
      <StepForm />
      <Flex
        backgroundColor={COLORS.grey10}
        alignItems={ALIGN_CENTER}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        height="calc(100vh - 64px)"
        justifyContent={JUSTIFY_CENTER}
      >
        <TimelineToolbox />
        {formData == null || formType === 'moveLabware' ? (
          <ToggleGroup
            selectedValue={deckView}
            leftText={leftString}
            rightText={rightString}
            leftClick={() => {
              setDeckView(leftString)
            }}
            rightClick={() => {
              setDeckView(rightString)
            }}
          />
        ) : null}
        <Flex
          width="751px"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
        >
          {deckView === leftString ? (
            <DeckSetupContainer tab="protocolSteps" />
          ) : (
            <OffDeck tab="protocolSteps" />
          )}
          <StepSummary currentStep={currentStep} />
        </Flex>
      </Flex>
    </>
  )
}
