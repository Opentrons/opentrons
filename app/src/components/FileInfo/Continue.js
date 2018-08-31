// @flow
// setup pipettes component
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'

import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotPipettes, makeGetRobotModules} from '../../http-api-client'
import {getPipette} from '@opentrons/shared-data'

import ContinueButtonGroup from './ContinueButtonGroup'
type Props = {
  pipettesMatch: boolean,
  modulesMatch: boolean,
}

export default connect(makeMapStateToProps, null)(Continue)

function Continue (props: Props) {
  const {
    pipettesMatch,
    modulesMatch
  } = props

  return (
    <ContinueButtonGroup runDisabled={!pipettesMatch || !modulesMatch}/>
  )
}

function makeMapStateToProps (): (state: State) => Props {
  const getAttachedPipettes = makeGetRobotPipettes()
  const getActualModules = makeGetRobotModules()
  return (state, props) => {
    const _robot = robotSelectors.getConnectedRobot(state)

    // TODO (ka 2018-8-31): Move this into a selector, or up to file info page
    const modulesCall = _robot && getActualModules(state, _robot)
    const modules = robotSelectors.getModules(state)
    const actualModules = modulesCall && modulesCall.response
    const moduleInfo = modules.map((module) => {
      const actualModel = actualModules && actualModules.modules.find((m) => m.name === module.name)
      let modulesMatch = true
      if (module && actualModel !== module.name) {
        modulesMatch = false
      }

      return {
        modulesMatch
      }
    })

    // TODO (ka 2018-8-31): Move this into a selector, or up to file info page
    const pipettesCall = _robot && getAttachedPipettes(state, _robot)
    const actualPipettes = pipettesCall && pipettesCall.response
    const pipettes = robotSelectors.getPipettes(state)
    const pipetteInfo = pipettes.map((p) => {
      const pipetteConfig = getPipette(p.name)

      const actualModel = actualPipettes && actualPipettes[p.mount].model
      let pipettesMatch = true

      if (pipetteConfig && actualModel !== pipetteConfig.model) {
        pipettesMatch = false
      }

      return {
        pipettesMatch
      }
    })

    const pipettesMatch = pipetteInfo.every((p) => p.pipettesMatch)
    const modulesMatch = moduleInfo.every((m) => m.modulesMatch)
    return {
      pipettesMatch,
      modulesMatch
    }
  }
}
