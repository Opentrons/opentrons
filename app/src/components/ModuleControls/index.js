// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import TemperatureControl from './TemperatureControl'

import useSendModuleCommand from './useSendModuleCommand'
import { getConnectedRobot } from '../../discovery'
import TemperatureData from './TemperatureData'
import styles from './styles.css'

import type { TempDeckModule, ThermocyclerModule } from '../../robot-api/types'
import type { Robot } from '../../discovery/types'

type Props = {|
  robot: Robot,
  module: TempDeckModule | ThermocyclerModule,
|}

function ModuleControls(props: Props) {
  const { module, robot } = props
  const { currentTemp, targetTemp, lidTemp, lidTarget } = module.data
  const sendModuleCommand = useSendModuleCommand()
  const connectedRobot: ?Robot = useSelector(getConnectedRobot)

  const canControl = connectedRobot && robot.name === connectedRobot.name

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
          disabled={!canControl}
          sendModuleCommand={sendModuleCommand}
        />
      </div>
    </div>
  )
}

export default ModuleControls
