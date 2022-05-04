import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  SIZE_4,
  Overlay,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { CONNECTABLE } from '../../redux/discovery'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Divider } from '../../atoms/structure'
import { Portal } from '../../App/portal'
import { ChooseProtocolSlideout } from '../ChooseProtocolSlideout'
import { ConnectionTroubleshootingModal } from './ConnectionTroubleshootingModal'

import type { StyleProps } from '@opentrons/components'
import type { DiscoveredRobot } from '../../redux/discovery/types'
interface RobotOverflowMenuProps extends StyleProps {
  robot: DiscoveredRobot
}

export function RobotOverflowMenu(props: RobotOverflowMenuProps): JSX.Element {
  const { robot, ...styleProps } = props
  const { t } = useTranslation(['devices_landing', 'shared'])
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)
  const [
    showConnectionTroubleshootingModal,
    setShowConnectionTroubleshootingModal,
  ] = React.useState<boolean>(false)

  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowChooseProtocolSlideout(true)
    setShowOverflowMenu(!showOverflowMenu)
  }
  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(!showOverflowMenu)
  }
  const handleClickOutside: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(false)
  }
  const handleClickConnectionTroubleshooting: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowConnectionTroubleshootingModal(true)
  }
  return (
    <Flex
      data-testid={`RobotCard_${robot.name}_overflowMenu`}
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      onClick={e => {
        e.preventDefault()
      }}
      {...styleProps}
    >
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          width={SIZE_4}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top={SPACING.spacing7}
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          {robot.status === CONNECTABLE ? (
            <MenuItem
              onClick={handleClickRun}
              data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
            >
              {t('run_protocol')}
            </MenuItem>
          ) : (
            <MenuItem onClick={handleClickConnectionTroubleshooting}>
              {t('why_is_this_robot_unavailable')}
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            to={`/devices/${robot.name}/robot-settings`}
            as={Link}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
          >
            {t('robot_settings')}
          </MenuItem>
        </Flex>
      ) : null}
      <Portal level="top">
        {showOverflowMenu ? (
          <Overlay
            onClick={handleClickOutside}
            backgroundColor={COLORS.transparent}
          />
        ) : null}
        {robot.status === CONNECTABLE ? (
          <ChooseProtocolSlideout
            robot={robot}
            showSlideout={showChooseProtocolSlideout}
            onCloseClick={() => setShowChooseProtocolSlideout(false)}
          />
        ) : null}
        {showConnectionTroubleshootingModal ? (
          <ConnectionTroubleshootingModal
            onClose={() => setShowConnectionTroubleshootingModal(false)}
          />
        ) : null}
      </Portal>
    </Flex>
  )
}
