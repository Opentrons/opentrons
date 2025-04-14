import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  FLEX_MAX_CONTENT,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
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
  getHoveredStepId,
  getHoveredTerminalItemId,
  getActiveItem,
} from '../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetup'
import { OffDeck } from '../OffDeck'
import { SubStepsToolbox } from './Timeline'
import { StepForm } from './StepForm'
import { StepSummary } from './StepSummary'
import { BatchEditToolbox } from './BatchEditToolbox'
import {
  getRobotStateTimeline,
  getRobotType,
} from '../../../file-data/selectors'
import { HotKeyDisplay } from '../../../components/molecules'
import {
  SlotDetailsContainer,
  TimelineAlerts,
} from '../../../components/organisms'
import { DraggableSidebar } from './DraggableSidebar'
import type { DeckSlot } from '../../../types'

const CONTENT_MAX_WIDTH = '46.9375rem'
const STEP_SUMMARY_HEIGHT = '14.7rem'

interface ProtocolStepsProps {
  isZoomedIn: boolean
}
export function ProtocolSteps(props: ProtocolStepsProps): JSX.Element {
  const { isZoomedIn } = props
  const { i18n, t } = useTranslation('starting_deck_state')
  const formData = useSelector(getUnsavedForm)
  const hoveredTerminalItem = useSelector(getHoveredTerminalItemId)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const enableHotKeyDisplay = useSelector(getEnableHotKeysDisplay)
  const robotType = useSelector(getRobotType)
  const activeItem = useSelector(getActiveItem)
  const [hoverSlot, setHoverSlot] = useState<DeckSlot | null>(null)
  const leftString = t('onDeck')
  const rightString = t('offDeck')
  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)
  // Note (02/03/25:kk) use DrraggableSidebar's initial width
  const [targetWidth, setTargetWidth] = useState<number>(235)

  const currentHoveredStepId = useSelector(getHoveredStepId)
  const savedStepForms = useSelector(getSavedStepForms)
  const currentStep =
    activeItem?.id != null ? savedStepForms[activeItem.id] : null

  const { errors: timelineErrors } = useSelector(getRobotStateTimeline)
  const hasTimelineErrors =
    timelineErrors != null ? timelineErrors.length > 0 : false
  const showTimelineAlerts =
    hasTimelineErrors && activeItem?.id !== '__initial_setup__'
  const stepDetails = currentStep?.stepDetails ?? null

  return (
    <Flex
      backgroundColor={COLORS.grey10}
      height="calc(100vh - 4rem)"
      width="100%"
      minHeight={FLEX_MAX_CONTENT}
    >
      <Flex height="100%" padding={SPACING.spacing12}>
        <DraggableSidebar setTargetWidth={setTargetWidth} />
      </Flex>
      <Flex
        flex="2.85"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        paddingTop={showTimelineAlerts || isZoomedIn ? '0' : SPACING.spacing24}
        height="100%"
        position={POSITION_RELATIVE}
        overflowY={'none'}
      >
        <Flex
          width="100%"
          height="100%"
          overflow={OVERFLOW_AUTO}
          flexDirection={DIRECTION_COLUMN}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing24}
            width={isZoomedIn ? '100%' : CONTENT_MAX_WIDTH}
            justifyContent={JUSTIFY_CENTER}
            paddingTop={isZoomedIn ? '0' : SPACING.spacing120}
            marginX="auto"
          >
            {isZoomedIn ? null : (
              <>
                {showTimelineAlerts ? (
                  <TimelineAlerts
                    justifyContent={JUSTIFY_CENTER}
                    width="100%"
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing4}
                  />
                ) : null}
                <Flex
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  alignItems={ALIGN_CENTER}
                  height="2.25rem"
                >
                  {currentStep != null && hoveredTerminalItem == null ? (
                    <StyledText desktopStyle="headingSmallBold">
                      {i18n.format(currentStep.stepName, 'titleCase')}
                    </StyledText>
                  ) : null}
                  {activeItem?.selectionType ===
                    'TERMINAL_ITEM_SELECTION_TYPE' &&
                  currentHoveredStepId == null ? (
                    <StyledText desktopStyle="headingSmallBold">
                      {t(activeItem.id)}
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
              </>
            )}
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing16}
              height="100%"
            >
              {deckView === leftString ? (
                <DeckSetupContainer
                  hoverSlot={hoverSlot}
                  setHoverSlot={setHoverSlot}
                  robotType={robotType}
                />
              ) : (
                <OffDeck />
              )}
              {isZoomedIn ? null : (
                <>
                  {/* avoid shifting the deck view container */}

                  <Flex
                    height={STEP_SUMMARY_HEIGHT}
                    // opacity={formData == null ? 1 : 0}
                  >
                    {activeItem?.selectionType ===
                    'TERMINAL_ITEM_SELECTION_TYPE' ? (
                      <SlotDetailsContainer
                        robotType={robotType}
                        slot={hoverSlot}
                      />
                    ) : (
                      <StepSummary
                        currentStep={currentStep}
                        stepDetails={stepDetails}
                      />
                    )}
                  </Flex>
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
        {enableHotKeyDisplay && !isZoomedIn ? (
          <HotKeyDisplay targetWidth={targetWidth} />
        ) : null}
      </Flex>
      {formData == null && selectedSubstep ? (
        <SubStepsToolbox stepId={selectedSubstep} />
      ) : null}
      <Flex padding={SPACING.spacing12}>
        <StepForm />
      </Flex>

      {isMultiSelectMode ? <BatchEditToolbox /> : null}
    </Flex>
  )
}
