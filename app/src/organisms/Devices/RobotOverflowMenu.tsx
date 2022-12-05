import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  TYPOGRAPHY,
} from '@opentrons/components'

import { CONNECTABLE, removeRobot } from '../../redux/discovery'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { ConnectionTroubleshootingModal } from './ConnectionTroubleshootingModal'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'

import type { StyleProps } from '@opentrons/components'
import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch } from '../../redux/types'

interface RobotOverflowMenuProps extends StyleProps {
  robot: DiscoveredRobot
}

export function RobotOverflowMenu(props: RobotOverflowMenuProps): JSX.Element {
  const { robot, ...styleProps } = props
  const { t } = useTranslation(['devices_landing', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const dispatch = useDispatch<Dispatch>()
  const [
    showConnectionTroubleshootingModal,
    setShowConnectionTroubleshootingModal,
  ] = React.useState<boolean>(false)

  const handleClickConnectionTroubleshooting: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowConnectionTroubleshootingModal(true)
    setShowOverflowMenu(false)
  }

  let menuItems: React.ReactNode
  if (robot.status === CONNECTABLE) {
    menuItems = (
      <MenuItem
        to={`/devices/${robot.name}/robot-settings`}
        as={Link}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        id={`RobotOverflowMenu_${robot.name}_robotSettings`}
      >
        {t('robot_settings')}
      </MenuItem>
    )
  } else {
    menuItems = (
      <>
        <MenuItem
          onClick={handleClickConnectionTroubleshooting}
          id={`RobotOverflowMenu_${robot.name}_robotUnavailable`}
        >
          {t('why_is_this_robot_unavailable')}
        </MenuItem>
        <MenuItem
          onClick={() => dispatch(removeRobot(robot.name))}
          id={`RobotOverflowMenu_${robot.name}_removeRobot`}
        >
          {t('forget_unavailable_robot')}
        </MenuItem>
      </>
    )
  }
  return (
    <Flex
      data-testid={`RobotCard_${robot.name}_overflowMenu`}
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      onClick={e => {
        e.stopPropagation()
      }}
      {...styleProps}
    >
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label="RobotOverflowMenu_button"
        onClick={handleOverflowClick}
      />
      {showOverflowMenu && !showConnectionTroubleshootingModal ? (
        <Flex
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.25rem"
          right="0"
          flexDirection={DIRECTION_COLUMN}
          id={`RobotOverflowMenu_${robot.name}_buttons`}
        >
          {menuItems}
        </Flex>
      ) : null}
      <Portal level="top">
        {showOverflowMenu && menuOverlay}

        {showConnectionTroubleshootingModal ? (
          <ConnectionTroubleshootingModal
            onClose={() => {
              setShowConnectionTroubleshootingModal(false)
            }}
          />
        ) : null}
      </Portal>
    </Flex>
  )
}
