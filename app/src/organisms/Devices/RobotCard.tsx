import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Box,
  Flex,
  Icon,
  Text,
  ALIGN_CENTER,
  ALIGN_START,
  C_BLUE,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SIZE_2,
  SPACING_2,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { useAttachedModules, useAttachedPipettes } from './hooks'
import { RobotStatusBanner } from './RobotStatusBanner'

import type { DiscoveredRobot } from '../../redux/discovery/types'

const iconNamesByModuleType = {
  [MAGNETIC_MODULE_TYPE]: 'ot-magnet',
  [TEMPERATURE_MODULE_TYPE]: 'ot-temperature',
  [THERMOCYCLER_MODULE_TYPE]: 'ot-thermocycler',
} as const

const ModuleIcon = ({
  moduleType,
}: {
  moduleType:
    | typeof MAGNETIC_MODULE_TYPE
    | typeof TEMPERATURE_MODULE_TYPE
    | typeof THERMOCYCLER_MODULE_TYPE
}): JSX.Element => {
  return (
    <Icon name={iconNamesByModuleType[moduleType]} marginRight={SPACING_2} />
  )
}

type RobotCardProps = Pick<DiscoveredRobot, 'name' | 'local'>

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { name = null, local } = props
  const { t } = useTranslation('devices_landing')

  const attachedModules = useAttachedModules(name)
  const attachedPipettes = useAttachedPipettes(name)

  return name != null ? (
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
      <img src={OT2_PNG} style={{ width: '6rem' }} />
      <Box padding={SPACING_2} width="100%">
        <RobotStatusBanner name={name} local={local} />
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
      {/* temp link from three dot menu to device detail page. Robot actions menu covered in ticket #8673 */}
      <Box alignSelf={ALIGN_START}>
        <Link to={`/devices/${name}`}>
          <Icon name="dots-horizontal" color={C_BLUE} size={SIZE_2} />
        </Link>
      </Box>
    </Flex>
  ) : null
}
