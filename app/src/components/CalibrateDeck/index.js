// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import {Route, withRouter, type Match} from 'react-router'

import type {Dispatch} from '../../types'
import type {Robot} from '../../robot'

import ClearDeckAlertModal from '../ClearDeckAlertModal'

type Props = {
  match: Match,
  robot: Robot,
  parentUrl: string,
}

const TITLE = 'Deck Calibration'

const ConnectedCalibrateDeckRouter = withRouter(
  connect(null, mapDispatchToProps)(CalibrateDeckRouter)
)

export default function CalibrateDeck (props: Props) {
  const {robot, parentUrl, match: {path}} = props
  return (
    <Route
      path={`${path}/:step`}
      render={(propsWithMount) => {
        const {match: {params, url: baseUrl}} = propsWithMount
        const step: string = (params.step: any)
        console.log(step)
        return (
          <ConnectedCalibrateDeckRouter
            robot={robot}
            title={TITLE}
            subtitle={`${step}`}
            parentUrl={parentUrl}
            baseUrl={baseUrl}
            exitUrl={`${baseUrl}/exit`}
          />
        )
      }}
    />
  )
}

type OP = {
  title: string,
  subtitle: string,
  robot: Robot,
  step: string,
  parentUrl: string,
  baseUrl: string,
  exitUrl: string,
}

type DP = {
  back: () => mixed,
}

function CalibrateDeckRouter (props: Props) {
  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl
  }
  // TODO: (ka 4/27/2018): defaulting to clear deck alert for initial PR
  return (
    <ClearDeckAlertModal {...clearDeckProps} />
  )
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    back: () => dispatch(goBack())
  }
}
