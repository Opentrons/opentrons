// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { LabeledValue } from '@opentrons/components'
import ModuleData from './ModuleData'
import TemperatureControl from './TemperatureControl'

import { sendModuleCommand } from '../../robot-api'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule, ModuleCommandRequest } from '../../robot-api'
import type { Robot } from '../../discovery'
import useSendModuleCommand from './useSendModuleCommand'
import styles from './styles.css'

type Props = {|
  robot: Robot,
  module: TempDeckModule,
|}

function ModuleControls(props: Props) {
  const { module } = props
  const { currentTemp, targetTemp } = module.data
  const sendModuleCommand = useSendModuleCommand()

  return (
    <div className={styles.module_data}>
      <LabeledValue
        label="Current Temp"
        value={currentTemp ? `${currentTemp} °C` : 'None'}
        className={styles.span_50}
      />
      <LabeledValue
        label="Target Temp"
        value={targetTemp ? `${targetTemp} °C` : 'None'}
        className={styles.span_50}
      />
      <TemperatureControl
        module={module}
        sendModuleCommand={sendModuleCommand}
      />
    </div>
  )
}

export default ModuleControls
