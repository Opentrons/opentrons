// Deck Calibration Orchestration Component
import * as React from 'react'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  ModalPage,
  Box,
  SpinnerModalPage,
  useConditionalConfirm,
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  SPACING,
  SPACING_3,
  C_TRANSPARENT,
  ALIGN_FLEX_START,
  C_WHITE,
  Flex,
  Icon,
  SIZE_4,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import { useFeatureFlag } from '../../redux/config'
import {
  DeckSetup,
  Introduction,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  CompleteConfirmation,
  ConfirmExitModal,
  INTENT_DECK_CALIBRATION,
} from '../../organisms/CalibrationPanels'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { Portal } from '../../App/portal'

import type { StyleProps, Mount } from '@opentrons/components'
import type {
  CalibrationLabware,
  CalibrationSessionStep,
  SessionCommandParams,
} from '../../redux/sessions/types'
import type { CalibrationPanelProps } from '../../organisms/CalibrationPanels/types'
import type { CalibrateDeckParentProps } from './types'

const DECK_CALIBRATION_SUBTITLE = 'Deck calibration'
const EXIT = 'exit'

const darkContentsStyleProps = {
  display: DISPLAY_FLEX,
  flexDirection: DIRECTION_COLUMN,
  alignItems: ALIGN_CENTER,
  padding: SPACING_3,
  backgroundColor: C_TRANSPARENT,
  height: '100%',
}
const contentsStyleProps = {
  display: DISPLAY_FLEX,
  backgroundColor: C_WHITE,
  flexDirection: DIRECTION_COLUMN,
  justifyContent: JUSTIFY_CENTER,
  alignItems: ALIGN_FLEX_START,
  padding: SPACING_3,
  maxWidth: '48rem',
  minHeight: '14rem',
}

const terminalContentsStyleProps = {
  ...contentsStyleProps,
  paddingX: '1.5rem',
}

const PANEL_BY_STEP: Partial<
  Record<CalibrationSessionStep, React.ComponentType<CalibrationPanelProps>>
> = {
  [Sessions.DECK_STEP_SESSION_STARTED]: Introduction,
  [Sessions.DECK_STEP_LABWARE_LOADED]: DeckSetup,
  [Sessions.DECK_STEP_PREPARING_PIPETTE]: TipPickUp,
  [Sessions.DECK_STEP_INSPECTING_TIP]: TipConfirmation,
  [Sessions.DECK_STEP_JOGGING_TO_DECK]: SaveZPoint,
  [Sessions.DECK_STEP_SAVING_POINT_ONE]: SaveXYPoint,
  [Sessions.DECK_STEP_SAVING_POINT_TWO]: SaveXYPoint,
  [Sessions.DECK_STEP_SAVING_POINT_THREE]: SaveXYPoint,
  [Sessions.DECK_STEP_CALIBRATION_COMPLETE]: CompleteConfirmation,
}

const PANEL_STYLE_PROPS_BY_STEP: Partial<
  Record<CalibrationSessionStep, StyleProps>
> = {
  [Sessions.DECK_STEP_SESSION_STARTED]: terminalContentsStyleProps,
  [Sessions.DECK_STEP_LABWARE_LOADED]: darkContentsStyleProps,
  [Sessions.DECK_STEP_PREPARING_PIPETTE]: contentsStyleProps,
  [Sessions.DECK_STEP_INSPECTING_TIP]: contentsStyleProps,
  [Sessions.DECK_STEP_JOGGING_TO_DECK]: contentsStyleProps,
  [Sessions.DECK_STEP_SAVING_POINT_ONE]: contentsStyleProps,
  [Sessions.DECK_STEP_SAVING_POINT_TWO]: contentsStyleProps,
  [Sessions.DECK_STEP_SAVING_POINT_THREE]: contentsStyleProps,
  [Sessions.DECK_STEP_CALIBRATION_COMPLETE]: terminalContentsStyleProps,
}
export function CalibrateDeck(
  props: CalibrateDeckParentProps
): JSX.Element | null {
  const { session, robotName, dispatchRequests, showSpinner, isJogging } = props
  const { currentStep, instrument, labware, supportedCommands } =
    session?.details || {}

  const enableCalibrationWizards = useFeatureFlag('enableCalibrationWizards')

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  const isMulti = React.useMemo(() => {
    const spec = instrument && getPipetteModelSpecs(instrument.model)
    return spec ? spec.channels > 1 : false
  }, [instrument])

  function sendCommands(...commands: SessionCommandParams[]): void {
    if (session?.id && !isJogging) {
      const sessionCommandActions = commands.map(c =>
        Sessions.createSessionCommand(robotName, session.id, {
          command: c.command,
          data: c.data || {},
        })
      )
      dispatchRequests(...sessionCommandActions)
    }
  }

  function cleanUpAndExit(): void {
    if (session?.id) {
      dispatchRequests(
        Sessions.createSessionCommand(robotName, session.id, {
          command: Sessions.sharedCalCommands.EXIT,
          data: {},
        }),
        Sessions.deleteSession(robotName, session.id)
      )
    }
  }

  const tipRack: CalibrationLabware | null =
    (labware && labware.find(l => l.isTiprack)) ?? null

  if (!session || !tipRack) {
    return null
  }

  const titleBarProps = {
    title: DECK_CALIBRATION_SUBTITLE,
    back: { onClick: confirmExit, title: EXIT, children: EXIT },
  }

  if (showSpinner && !enableCalibrationWizards) {
    // TODO: this is the old spinner modal, remove it when the `enableCalibrationWizards` FF is removed
    return <SpinnerModalPage titleBar={titleBarProps} />
  }
  // @ts-expect-error TODO: cannot index with undefined. Also, add test coverage for null case when no panel
  const Panel = PANEL_BY_STEP[currentStep]
  if (!showSpinner && Panel == null) return null
  return enableCalibrationWizards ? (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={DECK_CALIBRATION_SUBTITLE}
            currentStep={1}
            totalSteps={5}
            onExit={confirmExit}
          />
        }
      >
        <Box padding={SPACING.spacing6}>
          {(true || showSpinner) ? (
            <Flex justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER}>
              <Icon name="ot-spinner" spin size={SIZE_4} />
            </Flex>
          ) : (
            <Panel
              sendCommands={sendCommands}
              cleanUpAndExit={cleanUpAndExit}
              tipRack={tipRack}
              isMulti={isMulti}
              mount={instrument?.mount.toLowerCase() as Mount}
              currentStep={currentStep}
              sessionType={session.sessionType}
              intent={INTENT_DECK_CALIBRATION}
              supportedCommands={supportedCommands}
              defaultTipracks={instrument?.defaultTipracks}
            />
          )}
        </Box>
      </ModalShell>
      {showConfirmExit && (
        // @ts-expect-error TODO: ConfirmExitModal expects sessionType
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </Portal>
  ) : (
    <>
      <ModalPage
        titleBar={titleBarProps}
        innerProps={currentStep ? PANEL_STYLE_PROPS_BY_STEP[currentStep] : {}}
      >
        <Panel
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          tipRack={tipRack}
          isMulti={isMulti}
          mount={instrument?.mount.toLowerCase() as Mount}
          currentStep={currentStep}
          sessionType={session.sessionType}
          intent={INTENT_DECK_CALIBRATION}
          supportedCommands={supportedCommands}
          defaultTipracks={instrument?.defaultTipracks}
        />
      </ModalPage>
      {showConfirmExit && (
        // @ts-expect-error TODO: ConfirmExitModal expects sessionType
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </>
  )
}
