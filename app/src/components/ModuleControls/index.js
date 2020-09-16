// @flow
import * as React from 'react'

import { TemperatureControl } from './TemperatureControl'
import { THERMOCYCLER_MODULE_TYPE, useSendModuleCommand } from '../../modules'
import { TemperatureData } from './TemperatureData'
import styles from './styles.css'

import type { TemperatureModule, ThermocyclerModule } from '../../modules/types'

type Props = {|
  module: TemperatureModule | ThermocyclerModule,
  controlDisabledReason: string | null,
|}

const BLOCK_TEMPERATURE = 'Block Temperature:'
const LID_TEMPERATURE = 'Lid Temperature:'
const TEMPERATURE = 'Temperature:'

export function ModuleControls(props: Props): React.Node {
  const { module: mod, controlDisabledReason } = props
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
            mod.type === THERMOCYCLER_MODULE_TYPE
              ? BLOCK_TEMPERATURE
              : TEMPERATURE
          }
        />
        {mod.type === THERMOCYCLER_MODULE_TYPE && (
          <TemperatureData
            className={styles.temp_data_item}
            current={mod.data.lidTemp}
            target={mod.data.lidTarget}
            title={LID_TEMPERATURE}
          />
        )}
      </div>
      <div className={styles.control_wrapper}>
        <TemperatureControl
          module={mod}
          disabledReason={controlDisabledReason}
          sendModuleCommand={sendModuleCommand}
        />
      </div>
    </div>
  )
}

export { TemperatureControl, TemperatureData }
