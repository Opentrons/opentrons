import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import round from 'lodash/round'

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
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  ToggleGroup,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getPositionFromSlotId,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { ExportButton, HotKeyDisplay } from '../../../components/molecules'
import {
  SlotDetailsContainer,
  StepSummary,
  TimelineAlerts,
} from '../../../components/organisms'
import { DECK_SETUP_TOOLS_WIDTH_REM } from '../../../constants'
import { getEnableHotKeysDisplay } from '../../../feature-flags/selectors'
import {
  getRobotStateTimeline,
  getRobotType,
} from '../../../file-data/selectors'
import { selectZoomedIntoSlot } from '../../../labware-ingred/actions'
import { saveProtocolFile } from '../../../load-file/actions'
import { useProtocolExportHandler } from '../../../resources/hooks'
import {
  getSavedStepForms,
  getUnsavedForm,
} from '../../../step-forms/selectors'
import { HARDWARE_ID, START_TERMINAL_ITEM_ID } from '../../../steplist'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import {
  getActiveItem,
  getHoveredTerminalItemId,
  getIsMultiSelectMode,
  getSelectedStepId,
  getSelectedSubstep,
  getSelectedTerminalItemId,
} from '../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetup'
import { zoomInOnCoordinate } from '../DeckSetup/utils'
import { OffDeck } from '../OffDeck'
import { BatchEditToolbox } from './BatchEditToolbox'
import { DraggableSidebar } from './DraggableSidebar'
import { StepForm } from './StepForm'
import { SubStepsToolbox } from './Timeline'
import { TimelineEditHardware } from './TimelineEditHardware'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { DeckSlot, ThunkDispatch } from '../../../types'

const CONTENT_MAX_WIDTH = '46.9375rem'
const STEP_SUMMARY_HEIGHT = '18.2rem'
const WASTE_CHUTE_SPACE = 30
const DETAILS_HOVER_SPACE = 60

interface ProtocolStepsProps {
  zoomedInSlot: string | null
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
  showDefineLiquidModal: boolean
  targetWidth: number
  setTargetWidth: (width: number) => void
}
export function ProtocolSteps({
  zoomedInSlot,
  showLiquidOverflowMenu,
  showDefineLiquidModal,
  targetWidth,
  setTargetWidth,
}: ProtocolStepsProps): ReactNode {
  const { i18n, t } = useTranslation('starting_deck_state')
  const formData = useSelector(getUnsavedForm)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const hoveredTerminalItem = useSelector(getHoveredTerminalItemId)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const selectedStepId = useSelector(getSelectedStepId)
  const enableHotKeyDisplay = useSelector(getEnableHotKeysDisplay)
  const robotType = useSelector(getRobotType)
  const activeItem = useSelector(getActiveItem)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const { labware, additionalEquipmentOnDeck } = deckSetup
  const [hoverSlot, setHoverSlot] = useState<DeckSlot | null>(null)
  const savedStepForms = useSelector(getSavedStepForms)
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])
  const viewBoxX = deckDef.cornerOffsetFromOrigin[0]
  const windowInnerWidthRem = window.innerWidth / 16
  const deckMapRatio = round(
    (windowInnerWidthRem - DECK_SETUP_TOOLS_WIDTH_REM) / windowInnerWidthRem,
    2
  )
  const viewBoxY = Object.values(additionalEquipmentOnDeck).some(
    ae => ae.name === 'wasteChute'
  )
    ? deckDef.cornerOffsetFromOrigin[1] -
      WASTE_CHUTE_SPACE -
      DETAILS_HOVER_SPACE
    : deckDef.cornerOffsetFromOrigin[1]
  const viewBoxWidth = deckDef.dimensions[0] / deckMapRatio
  const viewBoxHeight = deckDef.dimensions[1] + DETAILS_HOVER_SPACE
  const initialViewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
  const [viewBox, setViewBox] = useState<string>(initialViewBox)

  const { errors: timelineErrors, timeline } = useSelector(
    getRobotStateTimeline
  )
  const hasCommands = timeline.length > 0

  const leftString = t('onDeck')
  const rightString = t('offDeck')
  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)
  const isOffDeck = deckView === rightString
  const isZoomedIn = zoomedInSlot != null

  const { handleExportClick, exportWarningModalElement } =
    useProtocolExportHandler({
      hasCommands,
      onConfirmExport: () => {
        dispatch(saveProtocolFile())
      },
    })
  let currentStep: FormData | null
  if (formData?.stepType === 'flexStacker') {
    currentStep = formData
  } else if (hoveredTerminalItem === HARDWARE_ID && selectedStepId != null) {
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

  const stepComponentRef = useRef<HTMLDivElement>(null)

  const handleScrollToTop = (): void => {
    if (stepComponentRef.current && hasTimelineErrors) {
      stepComponentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  useEffect(
    () => {
      if (selectedStepId != null) {
        handleScrollToTop()
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStepId]
  )

  let header: string = t(activeItem?.id)
  if (currentStep != null) {
    header = i18n.format(currentStep.stepName, 'titleCase')
  } else if (hoveredTerminalItem === HARDWARE_ID) {
    header = t(selectedTerminalItemId)
  }

  const zoomedInOnOffDeck =
    zoomedInSlot != null && labware[zoomedInSlot] != null
  //  zoom in already if you are exiting from adding liquids
  useEffect(
    () => {
      if (zoomedInSlot != null && !zoomedInOnOffDeck) {
        const zoomInSlotPosition = getPositionFromSlotId(
          zoomedInSlot ?? '',
          deckDef
        )
        if (zoomInSlotPosition != null) {
          const zoomedInViewBox = zoomInOnCoordinate({
            x: zoomInSlotPosition[0],
            y: zoomInSlotPosition[1],

            deckDef,
          })
          setViewBox(zoomedInViewBox)
        }
      } else if (
        zoomedInOnOffDeck &&
        selectedTerminalItemId! === START_TERMINAL_ITEM_ID
      ) {
        setDeckView(rightString)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoomedInSlot, labware, zoomedInOnOffDeck]
  )

  //  zoom out if you select on any step other than starting deck state in the timeline toolbox
  useEffect(
    () => {
      if (
        zoomedInSlot != null &&
        selectedTerminalItemId !== START_TERMINAL_ITEM_ID
      ) {
        dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
        setViewBox(initialViewBox)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoomedInSlot, selectedTerminalItemId]
  )

  return (
    <>
      {exportWarningModalElement}

      <Flex
        backgroundColor={COLORS.grey10}
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
          <DraggableSidebar
            setTargetWidth={setTargetWidth}
            showLiquidOverflowMenu={showLiquidOverflowMenu}
          />
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
            {isZoomedIn ||
            formData != null ||
            selectedSubstep != null ? null : (
              <Flex
                justifyContent={JUSTIFY_END}
                position={POSITION_ABSOLUTE}
                right={SPACING.spacing24}
              >
                <ExportButton onClick={handleExportClick} />
              </Flex>
            )}
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing24}
              width={
                (isZoomedIn && !isOffDeck) ||
                (selectedTerminalItemId === HARDWARE_ID &&
                  robotType === OT2_ROBOT_TYPE)
                  ? '90%'
                  : isZoomedIn && isOffDeck
                    ? '100%'
                    : CONTENT_MAX_WIDTH
              }
              justifyContent={JUSTIFY_CENTER}
              paddingTop={
                isZoomedIn || showTimelineAlerts ? '0' : SPACING.spacing60
              }
              marginX="auto"
            >
              {isZoomedIn || selectedTerminalItemId === HARDWARE_ID ? null : (
                <>
                  {showTimelineAlerts ? (
                    <>
                      {/* empty div to scroll to top of timeline alerts */}
                      <div ref={stepComponentRef} />
                      <TimelineAlerts
                        justifyContent={JUSTIFY_CENTER}
                        width="100%"
                        flexDirection={DIRECTION_COLUMN}
                        gridGap={SPACING.spacing4}
                      />
                    </>
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
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing16}
              >
                {selectedTerminalItemId === HARDWARE_ID ? (
                  <TimelineEditHardware />
                ) : deckView === leftString ? (
                  <DeckSetupContainer
                    viewBox={viewBox}
                    setViewBox={setViewBox}
                    deckDef={deckDef}
                    initialViewBox={initialViewBox}
                    hoverSlot={hoverSlot}
                    setHoverSlot={setHoverSlot}
                    robotType={robotType}
                    currentStep={currentStep}
                  />
                ) : (
                  <OffDeck setOverflowMenu={showLiquidOverflowMenu} />
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
          <Flex paddingY={SPACING.spacing12}>
            <SubStepsToolbox stepId={selectedSubstep} />
          </Flex>
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
    </>
  )
}
