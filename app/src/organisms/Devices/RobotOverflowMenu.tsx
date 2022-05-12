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
  Overlay,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { CONNECTABLE, removeRobot } from '../../redux/discovery'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { ChooseProtocolSlideout } from '../ChooseProtocolSlideout'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ConnectionTroubleshootingModal } from './ConnectionTroubleshootingModal'

import type { StyleProps } from '@opentrons/components'
import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch } from '../../redux/types'
interface RobotOverflowMenuProps extends StyleProps {
  robot: DiscoveredRobot
}

export function RobotOverflowMenu(props: RobotOverflowMenuProps): JSX.Element {
  const { robot, ...styleProps } = props
  const { t } = useTranslation(['devices_landing', 'shared'])
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const runId = useCurrentRunId()
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

  let menuItems: React.ReactNode
  if (robot.status === CONNECTABLE && runId == null) {
    menuItems = (
      <>
        <MenuItem
          onClick={handleClickRun}
          data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
        >
          {t('run_protocol')}
        </MenuItem>
        <Divider marginY={'0'} />
        <MenuItem
          to={`/devices/${robot.name}/robot-settings`}
          as={Link}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          id={`RobotOverflowMenu_${robot.name}_robotSettings`}
        >
          {t('robot_settings')}
        </MenuItem>
      </>
    )
  } else if (robot.status === CONNECTABLE && runId != null) {
    menuItems = (
      <MenuItem
        to={`/devices/${robot.name}/robot-settings`}
        as={Link}
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        id={`RobotOverflowMenu_${robot.name}_robotSettings_${runId}`}
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
        e.preventDefault()
      }}
      {...styleProps}
    >
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label="RobotOverflowMenu_button"
        onClick={handleOverflowClick}
      />
      {showOverflowMenu ? (
        <Flex
          width={'11rem'}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.6rem"
          right={`calc(50% + ${SPACING.spacing2})`}
          flexDirection={DIRECTION_COLUMN}
          id={`RobotOverflowMenu_${robot.name}_buttons`}
        >
          {menuItems}
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
