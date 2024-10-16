import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
  SPACING,
  Tag,
  ToggleGroup,
} from '@opentrons/components'
import {
  getSavedStepForms,
  getUnsavedForm,
} from '../../../step-forms/selectors'
import { getEnableHotKeysDisplay } from '../../../feature-flags/selectors'
import {
  getIsMultiSelectMode,
  getSelectedSubstep,
  getSelectedStepId,
  getHoveredStepId,
} from '../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetup'
import { OffDeck } from '../Offdeck'
import { TimelineToolbox, SubstepsToolbox } from './Timeline'
import { StepForm } from './StepForm'
import { StepSummary } from './StepSummary'
import { BatchEditToolbox } from './BatchEditToolbox'

export function ProtocolSteps(): JSX.Element {
  const { t } = useTranslation('starting_deck_state')
  const formData = useSelector(getUnsavedForm)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const enableHoyKeyDisplay = useSelector(getEnableHotKeysDisplay)
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

  const currentHoveredStepId = useSelector(getHoveredStepId)
  const currentSelectedStepId = useSelector(getSelectedStepId)
  const currentstepIdForStepSummary =
    currentHoveredStepId ?? currentSelectedStepId
  const savedStepForms = useSelector(getSavedStepForms)
  const currentStep =
    currentstepIdForStepSummary != null
      ? savedStepForms[currentstepIdForStepSummary]
      : null

  return (
    <Flex
      backgroundColor={COLORS.grey10}
      // alignItems={ALIGN_CENTER}
      width="100%"
      gridGap={SPACING.spacing16}
      height="calc(100vh - 4rem)"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <TimelineToolbox />
      {selectedSubstep ? <SubstepsToolbox stepId={selectedSubstep} /> : null}
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        width="100%"
        paddingBottom={enableHoyKeyDisplay ? '5rem' : '0'}
        paddingTop={SPACING.spacing16}
        justifyContent={JUSTIFY_FLEX_START}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          {formData == null || formType === 'moveLabware' ? (
            <Flex justifyContent={JUSTIFY_FLEX_END}>
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
            </Flex>
          ) : null}
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            {deckView === leftString ? (
              <DeckSetupContainer tab="protocolSteps" />
            ) : (
              <OffDeck tab="protocolSteps" />
            )}
            {formData == null ? (
              <StepSummary currentStep={currentStep} />
            ) : null}
          </Flex>
        </Flex>
        {enableHoyKeyDisplay ? (
          <Box position={POSITION_FIXED} left="20.25rem" bottom="0.75rem">
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              <Tag text={t('double_click_to_edit')} type="default" />
              <Tag text={t('shift_click_to_select_all')} type="default" />
              <Tag text={t('command_click_to_multi_select')} type="default" />
            </Flex>
          </Box>
        ) : null}
      </Flex>
      <StepForm />
      {isMultiSelectMode ? <BatchEditToolbox /> : null}
    </Flex>
  )
}
