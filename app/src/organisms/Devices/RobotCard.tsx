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
  BORDERS,
  ModuleIcon,
  useHoverTooltip,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { Tooltip } from '../../atoms/Tooltip'
import { StyledText } from '../../atoms/text'
import { useAttachedModules, useAttachedPipettes } from './hooks'
import { RobotStatusBanner } from './RobotStatusBanner'
import { RobotOverflowMenu } from './RobotOverflowMenu'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import { UNREACHABLE } from '../../redux/discovery'
// import { UpdateRobotBanner } from '../UpdateRobotBanner'

interface RobotCardProps {
  robot: DiscoveredRobot
}

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { robot } = props
  const { name = null, local } = robot
  const { t } = useTranslation('devices_landing')
  const attachedModules = useAttachedModules(name)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const attachedPipettes = useAttachedPipettes(name)

  return name != null ? (
    <Link to={`/devices/${name}`} style={{ color: 'inherit' }}>
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={C_WHITE}
        border={`1px solid ${C_MED_LIGHT_GRAY}`}
        borderRadius={BORDERS.radiusSoftCorners}
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
          {/* TODO: uncomment this when we prevent all nested clicks from triggering a route change * <UpdateRobotBanner robotName={name} marginBottom={SPACING.spacing3} /> */}
          {robot.status !== UNREACHABLE ? (
            <RobotStatusBanner name={name} local={local} />
          ) : null}
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
                    key={`${name}_${module.moduleModel}_${i}`}
                    moduleType={module.moduleType}
                    size={SPACING.spacing4}
                    iconTargetProps={targetProps}
                    moduleIconTooltip={
                      <Flex position="relative" marginTop={SPACING.spacingM}>
                        <Tooltip
                          tooltipProps={tooltipProps}
                          key={`ModuleIcon_tooltip_${i}`}
                        >
                          {t('this_robot_has_connected_and_power_on_module', {
                            moduleName: getModuleDisplayName(module.model),
                          })}
                        </Tooltip>
                      </Flex>
                    }
                  />
                ))}
              </Flex>
            </Flex>
          </Flex>
        </Box>
        <RobotOverflowMenu robot={robot} alignSelf={ALIGN_START} />
      </Flex>
    </Link>
  ) : null
}
