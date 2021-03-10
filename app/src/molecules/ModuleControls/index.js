// @flow
import * as React from 'react'

import {
  COLOR_SUCCESS,
  Box,
  Flex,
  Icon,
  Text,
  SIZE_1,
  JUSTIFY_FLEX_START,
  ALIGN_FLEX_START,
  TEXT_TRANSFORM_CAPITALIZE,
  SPACING_3,
  SPACING_2,
  ALIGN_CENTER,
  JUSTIFY_END,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  COLOR_WARNING_LIGHT,
  FONT_SIZE_BODY_1,
  DIRECTION_COLUMN,
} from '@opentrons/components'
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

export function ModuleControls(props: Props): React.Node {
  const { module: mod, controlDisabledReason } = props
  const sendModuleCommand = useSendModuleCommand()
  console.log(mod)
  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      {mod.type === MAGNETIC_MODULE_TYPE ? (
        <>
          <Flex fontSize={FONT_SIZE_BODY_1} alignItems={ALIGN_CENTER}>
            <Icon
              name="circle"
              width="10px"
              color={
                mod.status === 'engaged' ? COLOR_SUCCESS : COLOR_WARNING_LIGHT
              }
              marginRight="0.375rem"
            />
            <Text textTransform={TEXT_TRANSFORM_CAPITALIZE}>{mod.status}</Text>
            {mod.status === 'engaged' && (
              <Text>{`, ${mod.data.height} mm`}</Text>
            )}
          </Flex>
          <Flex>
            <MagnetControl
              module={mod}
              sendModuleCommand={sendModuleCommand}
              disabledReason={controlDisabledReason}
            />
          </Flex>
        </>
      ) : (
        <>
          <Box>
            {mod.type === THERMOCYCLER_MODULE_TYPE && (
              <TemperatureData
                status={mod.status}
                current={mod.data.lidTemp}
                target={mod.data.lidTarget}
                title="lid"
              />
            )}
            <TemperatureData
              status={mod.status}
              current={mod.data.currentTemp}
              target={mod.data.targetTemp}
              title={mod.type === THERMOCYCLER_MODULE_TYPE ? 'block' : null}
            />
          </Box>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <TemperatureControl
              module={mod}
              sendModuleCommand={sendModuleCommand}
              disabledReason={controlDisabledReason}
            />
          </Flex>
        </>
      )}
    </Flex>
  )
}

export { TemperatureControl, TemperatureData }
