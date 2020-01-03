// @flow
import * as React from 'react'
import { TemperatureControl } from './TemperatureControl'

import { useSendModuleCommand } from '../../modules'
import { TemperatureData } from './TemperatureData'
import styles from './styles.css'

import type { TemperatureModule, ThermocyclerModule } from '../../modules/types'
import { THERMOCYCLER } from '../../modules/constants'

type Props = {|
  module: TemperatureModule | ThermocyclerModule,
  canControl: boolean,
|}

export function ModuleControls(props: Props) {
  const { module: mod, canControl } = props
  const sendModuleCommand = useSendModuleCommand()

  return (
    <div className={styles.module_data}>
      <div className={styles.temp_data_buffer}></div>
      <div className={styles.temp_data_wrapper}>
        <TemperatureData
          className={styles.temp_data_item}
          current={mod.data.currentTemp}
          target={mod.data.targetTemp}
          title={
            mod.name === THERMOCYCLER ? 'Base Temperature:' : 'Temperature:'
          }
        />
        {mod.name === THERMOCYCLER && (
          <TemperatureData
            className={styles.temp_data_item}
            current={mod.data.lidTemp}
            target={mod.data.lidTarget}
            title="Lid Temperature:"
          />
        )}
      </div>
      <div className={styles.control_wrapper}>
        <TemperatureControl
          module={mod}
          disabled={!canControl}
          sendModuleCommand={sendModuleCommand}
        />
      </div>
    </div>
  )
}

export { TemperatureControl, TemperatureData }
