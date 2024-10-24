import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
  SPACING,
  StyledText,
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
import { getDesignerTab } from '../../../file-data/selectors'
import { TimelineAlerts } from '../../../organisms'

const CONTENT_MAX_WIDTH = '46.9375rem'

export function ProtocolSteps(): JSX.Element {
  const { i18n, t } = useTranslation('starting_deck_state')
  const formData = useSelector(getUnsavedForm)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const enableHoyKeyDisplay = useSelector(getEnableHotKeysDisplay)
  const tab = useSelector(getDesignerTab)
  const leftString = t('onDeck')
  const rightString = t('offDeck')
  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)

  const currentHoveredStepId = useSelector(getHoveredStepId)
  const currentSelectedStepId = useSelector(getSelectedStepId)
  const currentstepIdForStepSummary =
    currentHoveredStepId ?? currentSelectedStepId
  const savedStepForms = useSelector(getSavedStepForms)
  const currentStep =
    currentstepIdForStepSummary != null
      ? savedStepForms[currentstepIdForStepSummary]
      : null

  const stepDetails = currentStep?.stepDetails ?? null
  return (
    <Flex
      backgroundColor={COLORS.grey10}
      width="100%"
      gridGap={SPACING.spacing16}
      height="calc(100vh - 4rem)"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing12}
    >
      <TimelineToolbox />
      <Flex
        alignItems={ALIGN_CENTER}
        alignSelf={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        width="100%"
        justifyContent={JUSTIFY_FLEX_START}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          maxWidth={CONTENT_MAX_WIDTH}
        >
          {tab === 'protocolSteps' ? (
            <TimelineAlerts justifyContent={JUSTIFY_CENTER} width="100%" />
          ) : null}
          <Flex
            justifyContent={
              currentStep != null ? JUSTIFY_SPACE_BETWEEN : JUSTIFY_FLEX_END
            }
          >
            {currentStep != null ? (
              <StyledText desktopStyle="headingSmallBold">
                {i18n.format(currentStep.stepName, 'capitalize')}
              </StyledText>
            ) : null}
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
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            {deckView === leftString ? (
              <DeckSetupContainer tab="protocolSteps" />
            ) : (
              <OffDeck tab="protocolSteps" />
            )}
            {formData == null ? (
              <StepSummary
                currentStep={currentStep}
                stepDetails={stepDetails}
              />
            ) : null}
          </Flex>
        </Flex>
        {enableHoyKeyDisplay ? (
          <Box position={POSITION_FIXED} left="21rem" bottom="0.75rem">
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              <Tag text={t('double_click_to_edit')} type="default" />
              <Tag text={t('shift_click_to_select_all')} type="default" />
              <Tag text={t('command_click_to_multi_select')} type="default" />
            </Flex>
          </Box>
        ) : null}
      </Flex>
      {formData == null && selectedSubstep ? (
        <SubstepsToolbox stepId={selectedSubstep} />
      ) : null}
      <StepForm />
      {isMultiSelectMode ? <BatchEditToolbox /> : null}
    </Flex>
  )
}
