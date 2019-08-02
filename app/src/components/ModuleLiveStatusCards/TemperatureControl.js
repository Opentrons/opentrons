// @flow
import React, { useState } from 'react'
import { OutlineButton } from '@opentrons/components'
import type { ThermocyclerModule, ModuleCommandRequest } from '../../robot-api'
import styles from './styles.css'

type Props = {
  module: ThermocyclerModule,
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
}
const TemperatureControl = ({ module, sendModuleCommand }: Props) => {
  const [temperatureInput, setTemperatureInput] = useState('')

  const hasTarget = module.status !== 'idle'
  const handleClick = () => {
    const body = hasTarget
      ? { command_type: 'deactivate' }
      : {
          command_type: 'set_temperature',
          args: [Number(temperatureInput)],
        }
    sendModuleCommand(module.serial, body)
  }
  return (
    <>
      {!hasTarget && (
        <input
          className={styles.target_input}
          value={temperatureInput}
          onChange={e => setTemperatureInput(e.target.value)}
        />
      )}
      <OutlineButton onClick={handleClick}>
        {hasTarget ? 'Deactivate' : 'Set Temp'}
      </OutlineButton>
    </>
  )
}

export default TemperatureControl
