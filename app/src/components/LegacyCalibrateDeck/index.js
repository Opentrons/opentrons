// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push, goBack } from 'connected-react-router'
import { Switch, Route, withRouter } from 'react-router-dom'

import type { ContextRouter } from 'react-router-dom'
import type { State, Dispatch } from '../../types'
import type { OP, SP, DP, CalibrateDeckProps, CalibrationStep } from './types'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { chainActions } from '../../util'
import { createLogger } from '../../logger'

import { home, ROBOT } from '../../robot-controls'
import {
  startDeckCalibration,
  deckCalibrationCommand,
  clearDeckCalibration,
  makeGetDeckCalibrationCommandState,
  makeGetDeckCalibrationStartState,
} from '../../http-api-client'

import { ErrorModal } from '../modals'
import { ClearDeckAlert } from './ClearDeckAlert'
import { InUseModal } from './InUseModal'
import { NoPipetteModal } from './NoPipetteModal'
import { InstructionsModal } from './InstructionsModal'
import { ExitAlertModal } from './ExitAlertModal'

const log = createLogger(__filename)

const RE_STEP = '(1|2|3|4|5|6)'
const BAD_PIPETTE_ERROR = 'Unexpected pipette response from robot'
const ERROR_DESCRIPTION =
  'An unexpected error has cleared your deck calibration progress, please try again.'

export const CalibrateDeck: React.AbstractComponent<
  $Diff<OP, ContextRouter>
> = withRouter(
  connect<CalibrateDeckProps, OP, SP, _, _, _>(
    makeMapStateToProps,
    mapDispatchToProps
  )(CalibrateDeckComponent)
)

function CalibrateDeckComponent(props: CalibrateDeckProps) {
  const {
    startRequest,
    commandRequest,
    pipetteProps,
    exitError,
    match: { path },
  } = props

  if (pipetteProps && !pipetteProps.pipette) {
    return (
      <ErrorModal
        description={ERROR_DESCRIPTION}
        close={exitError}
        error={{ name: 'BadData', message: BAD_PIPETTE_ERROR }}
      />
    )
  }

  if (commandRequest.error) {
    return (
      <ErrorModal
        description={ERROR_DESCRIPTION}
        close={exitError}
        error={commandRequest.error}
      />
    )
  }

  return (
    <Switch>
      <Route
        path={path}
        exact
        render={() => {
          const { error } = startRequest

          if (error) {
            const { status } = error

            // conflict: token already issued
            if (status === 409) {
              return (
                <InUseModal forceStart={props.forceStart} close={exitError} />
              )
            }

            // forbidden: no pipette attached
            if (status === 403) {
              return <NoPipetteModal close={exitError} />
            }

            return (
              <ErrorModal
                description={ERROR_DESCRIPTION}
                close={exitError}
                error={error}
              />
            )
          }

          if (pipetteProps && pipetteProps.pipette) {
            return <ClearDeckAlert {...props} />
          }

          return null
        }}
      />
      <Route
        path={`${path}/step-:step${RE_STEP}`}
        render={stepProps => {
          if (!pipetteProps || !pipetteProps.pipette) return null

          const {
            match: { params, url: stepUrl },
          } = stepProps
          const step: CalibrationStep = (params.step: any)
          const exitUrl = `${stepUrl}/exit`

          const startedProps = {
            ...props,
            exitUrl,
            pipette: pipetteProps.pipette,
            mount: pipetteProps.mount,
            calibrationStep: step,
          }

          return (
            <div>
              <InstructionsModal {...startedProps} />
              <Route
                path={exitUrl}
                render={() => (
                  <ExitAlertModal back={props.back} exit={props.exit} />
                )}
              />
            </div>
          )
        }}
      />
    </Switch>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getDeckCalCommand = makeGetDeckCalibrationCommandState()
  const getDeckCalStartState = makeGetDeckCalibrationStartState()

  return (state, ownProps) => {
    const { robot } = ownProps
    const startRequest = getDeckCalStartState(state, robot)
    const pipetteInfo = startRequest.response && startRequest.response.pipette
    const pipetteProps = pipetteInfo
      ? {
          mount: pipetteInfo.mount,
          pipette: getPipetteModelSpecs(pipetteInfo.model),
        }
      : null

    if (pipetteProps && !pipetteProps.pipette) {
      log.error('Invalid pipette received from API', { pipetteInfo })
    }

    return {
      startRequest,
      pipetteProps,
      commandRequest: getDeckCalCommand(state, robot),
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, parentUrl } = ownProps

  return {
    jog: (axis, direction, step) =>
      dispatch(
        deckCalibrationCommand(robot, { command: 'jog', axis, direction, step })
      ),
    forceStart: () => dispatch(startDeckCalibration(robot, true)),
    // exit button click in title bar, opens exit alert modal, confirm exit click
    exit: () =>
      dispatch(
        chainActions(
          deckCalibrationCommand(robot, { command: 'release' }),
          push(parentUrl),
          home(robot.name, ROBOT)
        )
      ),
    // exit from error modal
    exitError: () =>
      dispatch(chainActions(clearDeckCalibration(robot), push(parentUrl))),
    // cancel button click in exit alert modal
    back: () => dispatch(goBack()),
  }
}
