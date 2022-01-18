import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Box,
  Flex,
  Icon,
  IconProps,
  Text,
  ALIGN_CENTER,
  ALIGN_START,
  C_BLUE,
  C_MED_DARK_GRAY,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SIZE_1,
  SIZE_2,
  SPACING_2,
  SPACING_3,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { useCurrentProtocolRun } from '../../organisms/ProtocolUpload/hooks'
import { useAttachedModules, useAttachedPipettes } from './hooks'

import type { DiscoveredRobot } from '../../redux/discovery/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OT2_PNG = require('../../assets/images/OT2-R_HERO.png')

type RobotCardProps = Pick<DiscoveredRobot, 'name' | 'local'>

export function RobotCard(props: RobotCardProps): JSX.Element {
  const { name = null, local } = props
  const { t } = useTranslation('devices_landing')

  const { protocolRecord, runRecord } = useCurrentProtocolRun()

  const isProtocolRunning =
    runRecord != null && runRecord.data.status !== RUN_STATUS_IDLE

  const ProtocolRunBanner = (): JSX.Element => (
    <Flex>
      <Text paddingRight={SPACING_2}>
        {`${t('running')} ${protocolRecord?.data.metadata.protocolName}`}
      </Text>
      <Link to={`/devices/${name}/protocol-runs/run`}>{t('go_to_run')}</Link>
    </Flex>
  )

  const ModuleIcon = ({
    moduleType,
  }: {
    moduleType:
      | typeof MAGNETIC_MODULE_TYPE
      | typeof TEMPERATURE_MODULE_TYPE
      | typeof THERMOCYCLER_MODULE_TYPE
  }): JSX.Element | null => {
    let iconName: IconProps['name'] | null = null

    if (moduleType === MAGNETIC_MODULE_TYPE) {
      iconName = 'ot-magnet'
    } else if (moduleType === TEMPERATURE_MODULE_TYPE) {
      iconName = 'ot-temperature'
    } else if (moduleType === THERMOCYCLER_MODULE_TYPE) {
      iconName = 'ot-thermocycler'
    }
    return iconName != null ? (
      <Icon name={iconName} marginRight={SPACING_2} />
    ) : null
  }

  const attachedModules = useAttachedModules(name)
  const attachedPipettes = useAttachedPipettes(name)

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={C_WHITE}
      border={`1px solid ${C_MED_LIGHT_GRAY}`}
      borderRadius="4px"
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING_2}
      padding={SPACING_2}
      width="100%"
    >
      <img src={OT2_PNG} width="93px" />
      <Box padding={SPACING_2} width="100%">
        <Flex flexDirection={DIRECTION_COLUMN}>
          {/* robot_model can be seen in the health response, but only for "connectable" robots. 
          Probably best to leave as "OT-2" for now */}
          <Text>OT-2</Text>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Flex paddingBottom={SPACING_3}>
              <Text as="span" marginRight={SPACING_3}>
                {name}
              </Text>
              <Icon
                // local boolean corresponds to a wired usb connection
                name={local ? 'usb' : 'wifi'}
                size={SIZE_1}
                marginRight={SPACING_2}
              />
              <Icon
                name="circle"
                color={isProtocolRunning ? C_BLUE : C_MED_DARK_GRAY}
                size={SIZE_1}
                marginRight={SPACING_2}
              />
              <Text as="span">
                {isProtocolRunning ? t('active') : t('idle')}
              </Text>
            </Flex>
            {isProtocolRunning ? <ProtocolRunBanner /> : null}
          </Flex>
        </Flex>
        <Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
            <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>
              {t('left_mount')}
            </Text>
            <Text>
              {attachedPipettes?.left?.modelSpecs.displayName ?? t('empty')}
            </Text>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
            <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>
              {t('right_mount')}
            </Text>
            <Text>
              {attachedPipettes?.right?.modelSpecs.displayName ?? t('empty')}
            </Text>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
            <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>{t('modules')}</Text>
            <Flex>
              {attachedModules.map(module => (
                <ModuleIcon key={module.model} moduleType={module.type} />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Icon
        name="dots-horizontal"
        color={C_BLUE}
        size={SIZE_2}
        alignSelf={ALIGN_START}
      />
    </Flex>
  )
}
