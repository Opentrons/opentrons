// @flow
import * as React from 'react'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  ModalPage,
  SpinnerModalPage,
  useConditionalConfirm,
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  SPACING_3,
  C_TRANSPARENT,
  ALIGN_FLEX_START,
  C_WHITE,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  ConfirmExitModal,
} from '../CalibrationPanels'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'
import { BadCalibration } from './BadCalibration'

import type { StyleProps } from '@opentrons/components'
import type { SessionCommandParams } from '../../sessions/types'

import type { CalibrationPanelProps } from '../CalibrationPanels/types'
import type { CalibrationHealthCheckParentProps } from './types'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Calibration health check'
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

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrationPanelProps>,
} = {
  [Sessions.CHECK_STEP_SESSION_STARTED]: Introduction,
  [Sessions.CHECK_STEP_LABWARE_LOADED]: DeckSetup,
  [Sessions.CHECK_STEP_PREPARING_PIPETTE]: TipPickUp,
  [Sessions.CHECK_STEP_INSPECTING_TIP]: TipConfirmation,
  [Sessions.CHECK_STEP_COMPARING_HEIGHT]: SaveZPoint,
  [Sessions.CHECK_STEP_COMPARING_POINT_ONE]: SaveXYPoint,
  [Sessions.CHECK_STEP_COMPARING_POINT_TWO]: SaveXYPoint,
  [Sessions.CHECK_STEP_COMPARING_POINT_THREE]: SaveXYPoint,
  [Sessions.CHECK_STEP_RETURNING_TIP]: ReturnTip,
  [Sessions.CHECK_STEP_RESULTS_SUMMARY]: ResultsSummary,
  [Sessions.CHECK_STEP_BAD_ROBOT_CALIBRATION]: BadCalibration,
}

const PANEL_STYLE_PROPS_BY_STEP: {
  [string]: StyleProps,
} = {
  [Sessions.CHECK_STEP_SESSION_STARTED]: terminalContentsStyleProps,
  [Sessions.CHECK_STEP_LABWARE_LOADED]: darkContentsStyleProps,
  [Sessions.CHECK_STEP_PREPARING_PIPETTE]: contentsStyleProps,
  [Sessions.CHECK_STEP_COMPARING_HEIGHT]: contentsStyleProps,
  [Sessions.CHECK_STEP_COMPARING_POINT_ONE]: contentsStyleProps,
  [Sessions.CHECK_STEP_COMPARING_POINT_TWO]: contentsStyleProps,
  [Sessions.CHECK_STEP_COMPARING_POINT_THREE]: terminalContentsStyleProps,
}

export function CheckHealthCalibration(
  props: CalibrationHealthCheckParentProps
): React.Node {
  const { session, robotName, dispatchRequests, showSpinner } = props
  const {
    currentStep,
    activePipette,
    activeTipRack,
    instruments,
    comparisonsByPipette,
  } = session?.details || {}

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  const isMulti = React.useMemo(() => {
    const spec = activePipette && getPipetteModelSpecs(activePipette.model)
    return spec ? spec.channels > 1 : false
  }, [activePipette])

  function sendCommands(...commands: Array<SessionCommandParams>) {
    if (session?.id) {
      const sessionCommandActions = commands.map(c =>
        Sessions.createSessionCommand(robotName, session.id, {
          command: c.command,
          data: c.data || {},
        })
      )
      dispatchRequests(...sessionCommandActions)
    }
  }

  function cleanUpAndExit() {
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

  const checkBothPipettes = instruments?.length === 2

  if (!session || !activeTipRack) {
    return null
  }

  const titleBarProps = {
    title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
    back: { onClick: confirmExit, title: EXIT, children: EXIT },
  }

  if (showSpinner) {
    return <SpinnerModalPage titleBar={titleBarProps} />
  }

  const Panel = PANEL_BY_STEP[currentStep]
  return Panel ? (
    <>
      <ModalPage
        titleBar={titleBarProps}
        innerProps={PANEL_STYLE_PROPS_BY_STEP[currentStep]}
      >
        <Panel
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          tipRack={activeTipRack}
          isMulti={isMulti}
          mount={activePipette?.mount.toLowerCase()}
          currentStep={currentStep}
          sessionType={session.sessionType}
          checkBothPipettes={checkBothPipettes}
          instruments={instruments}
          comparisonsByPipette={comparisonsByPipette}
          activePipette={activePipette}
        />
      </ModalPage>
      {showConfirmExit && (
        <ConfirmExitModal
          exit={confirmExit}
          back={cancelExit}
          sessionType={session.sessionType}
        />
      )}
    </>
  ) : null
}
