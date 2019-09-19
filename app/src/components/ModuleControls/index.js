// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import ModuleData from './ModuleData'
import TemperatureControl from './TemperatureControl'

import { sendModuleCommand } from '../../robot-api'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule, ModuleCommandRequest } from '../../robot-api'
import type { Robot } from '../../discovery'
import useSendModuleCommand from './useSendModuleCommand'

type Props = {|
  robot: Robot,
  module: TempDeckModule,
|}

function ModuleControls(props: Props) {
  const { module } = props
  const { currentTemp, targetTemp } = module.data
  const sendModuleCommand = useSendModuleCommand()

  return (
    <>
      <ModuleData currentTemp={currentTemp} targetTemp={targetTemp} />
      <TemperatureControl
        module={module}
        sendModuleCommand={sendModuleCommand}
      />
    </>
  )
}

export default ModuleControls
