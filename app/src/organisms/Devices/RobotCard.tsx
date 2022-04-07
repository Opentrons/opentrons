import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  ALIGN_START,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  TEXT_TRANSFORM_UPPERCASE,
  ModuleIcon,
} from '@opentrons/components'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { StyledText } from '../../atoms/text'
import { useAttachedModules, useAttachedPipettes } from './hooks'
import { RobotStatusBanner } from './RobotStatusBanner'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'

type RobotCardProps = Pick<DiscoveredRobot, 'name' | 'local'>

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { name = null, local } = props
  const { t } = useTranslation('devices_landing')

  const attachedModules = useAttachedModules(name)
  const attachedPipettes = useAttachedPipettes(name)

  return name != null ? (
    <Link to={`/devices/${name}`} style={{ color: 'inherit' }}>
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={C_WHITE}
        border={`1px solid ${C_MED_LIGHT_GRAY}`}
        borderRadius="4px"
        flexDirection={DIRECTION_ROW}
        marginBottom={SPACING.spacing3}
        padding={SPACING.spacing3}
        width="100%"
      >
        <img
          src={OT2_PNG}
          style={{ width: '6rem' }}
          id={`RobotCard_${name}_robotImage`}
        />
        <Box padding={SPACING.spacing3} width="100%">
          <RobotStatusBanner name={name} local={local} />
          <Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText as="h6" textTransform={TEXT_TRANSFORM_UPPERCASE}>
                {t('left_mount')}
              </StyledText>
              <StyledText as="p" id={`RobotCard_${name}_leftMountPipette`}>
                {attachedPipettes?.left?.modelSpecs.displayName ?? t('empty')}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText as="h6" textTransform={TEXT_TRANSFORM_UPPERCASE}>
                {t('right_mount')}
              </StyledText>
              <StyledText as="p" id={`RobotCard_${name}_rightMountPipette`}>
                {attachedPipettes?.right?.modelSpecs.displayName ?? t('empty')}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText as="h6" textTransform={TEXT_TRANSFORM_UPPERCASE}>
                {t('modules')}
              </StyledText>
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
        {/* attachment of RobotCard_${name}_overflowMenu selector may change */}
        <OverflowBtn
          id={`RobotCard_${name}_overflowMenu`}
          alignSelf={ALIGN_START}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            console.log('TODO set show overflow menu')
          }}
        />
      </Flex>
    </Link>
  ) : null
}
