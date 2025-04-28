import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  FLEX_MAX_CONTENT,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  ToggleGroup,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { NAV_BAR_HEIGHT_REM } from '../../../components/atoms'
import { HotKeyDisplay, LiquidButton } from '../../../components/molecules'
import {
  SlotDetailsContainer,
  TimelineAlerts,
} from '../../../components/organisms'
import { getEnableHotKeysDisplay } from '../../../feature-flags/selectors'
import {
  getRobotStateTimeline,
  getRobotType,
} from '../../../file-data/selectors'
import {
  getSavedStepForms,
  getUnsavedForm,
} from '../../../step-forms/selectors'
import { HARDWARE_ID, START_TERMINAL_ITEM_ID } from '../../../steplist'
import type { DeckSlot } from '../../../types'
import {
  getActiveItem,
  getHoveredTerminalItemId,
  getIsMultiSelectMode,
  getSelectedStepId,
  getSelectedSubstep,
  getSelectedTerminalItemId,
} from '../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetup'
import { OffDeck } from '../OffDeck'
import { BatchEditToolbox } from './BatchEditToolbox'
import { DraggableSidebar } from './DraggableSidebar'
import { StepForm } from './StepForm'
import { StepSummary } from './StepSummary'
import { SubStepsToolbox } from './Timeline'
import { TimelineEditHardware } from './TimelineEditHardware'

const CONTENT_MAX_WIDTH = '46.9375rem'
const STEP_SUMMARY_HEIGHT = '14.7rem'

interface ProtocolStepsProps {
  isZoomedIn: boolean
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}
export function ProtocolSteps(props: ProtocolStepsProps): JSX.Element {
  const { isZoomedIn, showLiquidOverflowMenu } = props
  const { i18n, t } = useTranslation('starting_deck_state')
  const formData = useSelector(getUnsavedForm)
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const hoveredTerminalItem = useSelector(getHoveredTerminalItemId)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const selectedStepId = useSelector(getSelectedStepId)
  const enableHotKeyDisplay = useSelector(getEnableHotKeysDisplay)
  const robotType = useSelector(getRobotType)
  const activeItem = useSelector(getActiveItem)
  const [hoverSlot, setHoverSlot] = useState<DeckSlot | null>(null)
  const savedStepForms = useSelector(getSavedStepForms)
  const { errors: timelineErrors } = useSelector(getRobotStateTimeline)
  const leftString = t('onDeck')
  const rightString = t('offDeck')
  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)
  // Note (02/03/25:kk) use DrraggableSidebar's initial width
  const [targetWidth, setTargetWidth] = useState<number>(235)

  let currentStep
  if (hoveredTerminalItem === HARDWARE_ID && selectedStepId != null) {
    currentStep = savedStepForms[selectedStepId]
  } else if (hoveredTerminalItem === HARDWARE_ID && selectedStepId == null) {
    currentStep = null
  } else {
    currentStep = activeItem?.id != null ? savedStepForms[activeItem.id] : null
  }

  const hasTimelineErrors =
    timelineErrors != null ? timelineErrors.length > 0 : false
  const showTimelineAlerts =
    hasTimelineErrors &&
    activeItem?.id !== START_TERMINAL_ITEM_ID &&
    activeItem?.id !== HARDWARE_ID
  const stepDetails = currentStep?.stepDetails ?? null

  let header: string = t(activeItem?.id)
  if (currentStep != null) {
    header = i18n.format(currentStep.stepName, 'titleCase')
  } else if (hoveredTerminalItem === HARDWARE_ID) {
    header = t(selectedTerminalItemId)
  }

  return (
    <Flex
      backgroundColor={COLORS.grey10}
      maxHeight={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem)`}
      width="100%"
      minHeight={FLEX_MAX_CONTENT}
    >
      <Flex
        height="100%"
        padding={
          isZoomedIn
            ? `${SPACING.spacing12} 0 ${SPACING.spacing12} ${SPACING.spacing12}`
            : SPACING.spacing12
        }
      >
        <DraggableSidebar setTargetWidth={setTargetWidth} />
      </Flex>
      <Flex
        flex="2.85"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        paddingTop={isZoomedIn ? '0' : SPACING.spacing12}
        height="100%"
        position={POSITION_RELATIVE}
        overflowY={OVERFLOW_AUTO}
      >
        <Flex
          width="100%"
          height="100%"
          overflow={OVERFLOW_AUTO}
          flexDirection={DIRECTION_COLUMN}
        >
          {isZoomedIn ? null : (
            <Flex justifyContent={JUSTIFY_END}>
              <LiquidButton showLiquidOverflowMenu={showLiquidOverflowMenu} />
            </Flex>
          )}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing24}
            width={
              isZoomedIn ||
              (selectedTerminalItemId === HARDWARE_ID &&
                robotType === OT2_ROBOT_TYPE)
                ? '90%'
                : CONTENT_MAX_WIDTH
            }
            justifyContent={JUSTIFY_CENTER}
            paddingTop={isZoomedIn ? '0' : SPACING.spacing60}
            marginX="auto"
          >
            {isZoomedIn || selectedTerminalItemId === HARDWARE_ID ? null : (
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
                  <StyledText desktopStyle="headingSmallBold">
                    {header}
                  </StyledText>
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
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
              {selectedTerminalItemId === HARDWARE_ID ? (
                <TimelineEditHardware />
              ) : deckView === leftString ? (
                <DeckSetupContainer
                  hoverSlot={hoverSlot}
                  setHoverSlot={setHoverSlot}
                  robotType={robotType}
                />
              ) : (
                <OffDeck />
              )}
              {isZoomedIn || selectedTerminalItemId === HARDWARE_ID ? null : (
                <>
                  {/* avoid shifting the deck view container */}
                  <Flex
                    height={STEP_SUMMARY_HEIGHT}
                    opacity={formData == null ? 1 : 0}
                  >
                    {activeItem?.id === START_TERMINAL_ITEM_ID ? (
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
      <Flex
        padding={
          formData == null ? `0 ${SPACING.spacing12} 0 0` : SPACING.spacing12
        }
      >
        <StepForm />
      </Flex>

      {isMultiSelectMode ? <BatchEditToolbox /> : null}
    </Flex>
  )
}
