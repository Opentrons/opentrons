// @flow
import * as React from 'react'

import { COLOR_SUCCESS, COLOR_WARNING, Box, Flex, Icon, Text, SIZE_1, JUSTIFY_FLEX_START, ALIGN_FLEX_START, TEXT_TRANSFORM_CAPITALIZE, SPACING_3, SPACING_2, ALIGN_CENTER, JUSTIFY_END, JUSTIFY_FLEX_END, JUSTIFY_SPACE_BETWEEN } from '@opentrons/components'
import { TemperatureControl } from './TemperatureControl'
import { MagnetControl } from './MagnetControl'
import {
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  useSendModuleCommand,
} from '../../redux/modules'
import { TemperatureData } from './TemperatureData'
import styles from './styles.css'

import type {
  MagneticModule,
  TemperatureModule,
  ThermocyclerModule,
  MagneticStatus,
} from '../../redux/modules/types'

type Props = {|
  module: MagneticModule | TemperatureModule | ThermocyclerModule,
  controlDisabledReason: string | null,
|}

const BLOCK_TEMPERATURE = 'Block Temperature:'
const LID_TEMPERATURE = 'Lid Temperature:'
const TEMPERATURE = 'Temperature:'

export function ModuleControls(props: Props): React.Node {
  const { module: mod, controlDisabledReason } = props
  const sendModuleCommand = useSendModuleCommand()

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginBottom={SPACING_3}>
      {mod.type === MAGNETIC_MODULE_TYPE ? (
        <>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon name="circle" width="10px" color={mod.status === 'engaged' ? COLOR_SUCCESS : COLOR_WARNING} marginRight="0.375rem" />
            <Text textTransform={TEXT_TRANSFORM_CAPITALIZE}>{mod.status}</Text>
            {mod.status === 'engaged' &&
              <Text>{`, ${mod.data.height} mm`}</Text>
            }
          </Flex>
          <Flex>
            <MagnetControl module={mod} sendModuleCommand={sendModuleCommand} />
          </Flex>
        </>
      ) : (
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
      )}
    </Flex>
  )
}

export { TemperatureControl, TemperatureData }
