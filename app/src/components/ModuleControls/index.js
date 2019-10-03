// @flow
import * as React from 'react'
import TemperatureControl from './TemperatureControl'

import type { TempDeckModule, ThermocyclerModule } from '../../robot-api'
import type { Robot } from '../../discovery'
import useSendModuleCommand from './useSendModuleCommand'
import styles from './styles.css'
import TemperatureData from './TemperatureData'

type Props = {|
  robot: Robot,
  module: TempDeckModule | ThermocyclerModule,
|}

function ModuleControls(props: Props) {
  const { module } = props
  const { currentTemp, targetTemp, lidTemp, lidTarget } = module.data
  const sendModuleCommand = useSendModuleCommand()

  return (
    <div className={styles.module_data}>
      <div className={styles.temp_data_buffer}></div>
      <div className={styles.temp_data_wrapper}>
        <TemperatureData
          className={styles.temp_data_item}
          current={currentTemp}
          target={targetTemp}
          title={lidTemp ? 'Base Temperature:' : 'Temperature:'}
        />
        {lidTemp && (
          <TemperatureData
            className={styles.temp_data_item}
            current={lidTemp}
            target={lidTarget}
            title="Lid Temperature:"
          />
        )}
      </div>
      <div className={styles.control_wrapper}>
        <TemperatureControl
          module={module}
          sendModuleCommand={sendModuleCommand}
        />
      </div>
    </div>
  )
}

export default ModuleControls
