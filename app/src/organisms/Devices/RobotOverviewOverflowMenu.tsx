import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  useInterval,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { checkShellUpdate } from '../../redux/shell'
import { restartRobot } from '../../redux/robot-admin'
import { UpdateBuildroot } from '../../pages/Robots/RobotSettings/UpdateBuildroot'
import { UNREACHABLE } from '../../redux/discovery'
import { home, ROBOT } from '../../redux/robot-controls'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'
import { useCurrentRunStatus } from '../RunTimeControl/hooks'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch, State } from '../../redux/types'

interface RobotOverviewOverflowMenuProps {
  robot: DiscoveredRobot
}

const UPDATE_RECHECK_DELAY_MS = 60000

export const RobotOverviewOverflowMenu = (
  props: RobotOverviewOverflowMenuProps
): JSX.Element => {
  const { robot } = props
  const { t } = useTranslation(['devices_landing', 'robot_controls'])
  const {
    MenuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const currentRunStatus = useCurrentRunStatus()
  const buttonDisabledReason =
    currentRunStatus === RUN_STATUS_RUNNING || robot.status === 'unreachable'

  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])

  const handleClickRestart: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    dispatch(restartRobot(robot.name))
    setShowOverflowMenu(false)
  }

  const handleClickHomeGantry: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    dispatch(home(robot.name, ROBOT))
    setShowOverflowMenu(false)
  }

  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(false)

  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  const handleClickUpdateBuildroot: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowSoftwareUpdateModal(true)
  }

  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robot.name)
  })

  return (
    <Flex
      data-testid={`RobotOverview_overflowMenu`}
      position={POSITION_RELATIVE}
      onClick={e => {
        e.preventDefault()
      }}
    >
      {showSoftwareUpdateModal &&
      robot != null &&
      robot.status !== UNREACHABLE ? (
        <Portal level="top">
          <UpdateBuildroot
            robot={robot}
            close={() => setShowSoftwareUpdateModal(false)}
          />
        </Portal>
      ) : null}
      <OverflowBtn aria-label="overflow" onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          width={'12rem'}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top={SPACING.spacing7}
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          {autoUpdateAction === 'upgrade' ? (
            <MenuItem
              disabled={buttonDisabledReason}
              onClick={handleClickUpdateBuildroot}
              data-testid={`RobotOverviewOverflowMenu_updateSoftware_${robot.name}`}
            >
              {t('update_robot_software')}
            </MenuItem>
          ) : null}
          <MenuItem
            onClick={handleClickRestart}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            disabled={buttonDisabledReason}
            data-testid={`RobotOverviewOverflowMenu_restartRobot_${robot.name}`}
          >
            {t('robot_controls:restart_label')}
          </MenuItem>
          <MenuItem
            onClick={handleClickHomeGantry}
            disabled={buttonDisabledReason}
            data-testid={`RobotOverviewOverflowMenu_homeGantry_${robot.name}`}
          >
            {t('home_gantry')}
          </MenuItem>
          <Divider marginY={'0'} />
          <MenuItem
            to={`/devices/${robot.name}/robot-settings`}
            as={Link}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            disabled={buttonDisabledReason}
            data-testid={`RobotOverviewOverflowMenu_robotSettings_${robot.name}`}
          >
            {t('robot_settings')}
          </MenuItem>
        </Flex>
      ) : null}
      <MenuOverlay />
    </Flex>
  )
}
