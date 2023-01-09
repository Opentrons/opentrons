import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  useHoverTooltip,
  useMountEffect,
} from '@opentrons/components'
import { checkShellUpdate } from '../../redux/shell'
import { restartRobot } from '../../redux/robot-admin'
import { home, ROBOT } from '../../redux/robot-controls'
import { UNREACHABLE, CONNECTABLE, REACHABLE } from '../../redux/discovery'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Tooltip } from '../../atoms/Tooltip'
import { Portal } from '../../App/portal'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ChooseProtocolSlideout } from '../ChooseProtocolSlideout'
import { useIsRobotBusy } from './hooks'
import { UpdateBuildroot } from './RobotSettings/UpdateBuildroot'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch, State } from '../../redux/types'

interface RobotOverviewOverflowMenuProps {
  robot: DiscoveredRobot
}

export const RobotOverviewOverflowMenu = (
  props: RobotOverviewOverflowMenuProps
): JSX.Element => {
  const { robot } = props
  const { t } = useTranslation(['devices_landing', 'robot_controls', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const history = useHistory()
  const isRobotBusy = useIsRobotBusy()
  const runId = useCurrentRunId()
  const [targetProps, tooltipProps] = useHoverTooltip()

  const dispatch = useDispatch<Dispatch>()

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
  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const handleClickUpdateBuildroot: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowSoftwareUpdateModal(true)
  }

  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowChooseProtocolSlideout(true)
    setShowOverflowMenu(false)
  }

  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robot.name)
  })
  const isRobotOnWrongVersionOfSoftware =
    autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade'
  const isRobotUnavailable = isRobotBusy || robot?.status !== CONNECTABLE

  return (
    <Flex
      data-testid="RobotOverview_overflowMenu"
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
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius={BORDERS.radiusSoftCorners}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.25rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          {isRobotOnWrongVersionOfSoftware && !isRobotUnavailable ? (
            <MenuItem
              onClick={handleClickUpdateBuildroot}
              data-testid={`RobotOverviewOverflowMenu_updateSoftware_${String(
                robot.name
              )}`}
            >
              {t('update_robot_software')}
            </MenuItem>
          ) : null}
          {robot.status === CONNECTABLE && runId == null ? (
            <>
              <MenuItem
                {...targetProps}
                onClick={handleClickRun}
                disabled={isRobotOnWrongVersionOfSoftware || isRobotBusy}
                data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
              >
                {t('run_a_protocol')}
              </MenuItem>
              {isRobotOnWrongVersionOfSoftware && (
                <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
                  {t('shared:a_software_update_is_available')}
                </Tooltip>
              )}
            </>
          ) : null}
          <MenuItem
            disabled={isRobotUnavailable}
            onClick={handleClickHomeGantry}
            data-testid={`RobotOverviewOverflowMenu_homeGantry_${String(
              robot.name
            )}`}
          >
            {t('home_gantry')}
          </MenuItem>
          <MenuItem
            disabled={isRobotUnavailable}
            onClick={handleClickRestart}
            data-testid={`RobotOverviewOverflowMenu_restartRobot_${String(
              robot.name
            )}`}
          >
            {t('robot_controls:restart_label')}
          </MenuItem>
          <Divider marginY="0" />
          <MenuItem
            onClick={() =>
              history.push(`/devices/${robot.name}/robot-settings`)
            }
            disabled={
              robot == null ||
              robot?.status === UNREACHABLE ||
              (robot?.status === REACHABLE &&
                robot?.serverHealthStatus !== 'ok')
            }
            data-testid={`RobotOverviewOverflowMenu_robotSettings_${String(
              robot.name
            )}`}
          >
            {t('robot_settings')}
          </MenuItem>
        </Flex>
      ) : null}
      {robot.status === CONNECTABLE ? (
        <ChooseProtocolSlideout
          robot={robot}
          showSlideout={showChooseProtocolSlideout}
          onCloseClick={() => setShowChooseProtocolSlideout(false)}
        />
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
