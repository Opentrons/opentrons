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

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { ModuleIcon } from './ModuleIcon'
import { useAttachedModules, useAttachedPipettes } from './hooks'
import { RobotStatusBanner } from './RobotStatusBanner'

import type { DiscoveredRobot } from '../../redux/discovery/types'

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
      <img src={OT2_PNG} style={{ width: '6rem' }} id="RobotCard_robotImage" />
      <Box padding={SPACING_2} width="100%">
        <RobotStatusBanner name={name} local={local} />
        <Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
            <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>
              {t('left_mount')}
            </Text>
            <Text id="RobotCard_leftMountPipette">
              {attachedPipettes?.left?.modelSpecs.displayName ?? t('empty')}
            </Text>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
            <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>
              {t('right_mount')}
            </Text>
            <Text id="RobotCard_rightMountPipette">
              {attachedPipettes?.right?.modelSpecs.displayName ?? t('empty')}
            </Text>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
            <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>{t('modules')}</Text>
            <Flex>
              {attachedModules.map((module, i) => (
                <ModuleIcon
                  key={`${name}_${module.model}_${i}`}
                  moduleType={module.type}
                />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Box>
      {/* temp link from three dot menu to device detail page. Robot actions menu covered in ticket #8673 */}
      {/* attachment of RobotCard_overflowMenu selector may change */}
      <Box alignSelf={ALIGN_START} id="RobotCard_overflowMenu">
        <Link to={`/devices/${name}`}>
          <Icon name="dots-horizontal" color={C_BLUE} size={SIZE_2} />
        </Link>
      </Box>
    </Flex>
  ) : null
}
