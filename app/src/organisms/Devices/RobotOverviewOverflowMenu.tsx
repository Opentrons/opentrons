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

import { Portal } from '../../App/portal'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'
import { Tooltip } from '../../atoms/Tooltip'
import { ChooseProtocolSlideout } from '../../organisms/ChooseProtocolSlideout'
import { DisconnectModal } from '../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
import { UpdateBuildroot } from '../../organisms/Devices/RobotSettings/UpdateBuildroot'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { UNREACHABLE, CONNECTABLE, REACHABLE } from '../../redux/discovery'
import { checkShellUpdate } from '../../redux/shell'
import { restartRobot } from '../../redux/robot-admin'
import { home, ROBOT } from '../../redux/robot-controls'
import { useIsRobotBusy } from './hooks'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch, State } from '../../redux/types'
import { useCanDisconnect } from '../../resources/networking/hooks'

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

  const handleClickRestart: React.MouseEventHandler<HTMLButtonElement> = () => {
    dispatch(restartRobot(robot.name))
  }

  const handleClickHomeGantry: React.MouseEventHandler<HTMLButtonElement> = () => {
    dispatch(home(robot.name, ROBOT))
  }

  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(false)
  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)
  const [showDisconnectModal, setShowDisconnectModal] = React.useState<boolean>(
    false
  )

  const canDisconnect = useCanDisconnect(robot.name)

  const handleClickDisconnect: React.MouseEventHandler<HTMLButtonElement> = () => {
    setShowDisconnectModal(true)
  }

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const handleClickUpdateBuildroot: React.MouseEventHandler = () => {
    setShowSoftwareUpdateModal(true)
  }

  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = () => {
    setShowChooseProtocolSlideout(true)
  }

  const { autoUpdateAction } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robot.name)
  })
  const isRobotOnWrongVersionOfSoftware =
    autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade'
  const isRobotUnavailable = isRobotBusy || robot?.status !== CONNECTABLE

  return (
    <Flex data-testid="RobotOverview_overflowMenu" position={POSITION_RELATIVE}>
      <Portal level="top">
        {showSoftwareUpdateModal &&
        robot != null &&
        robot.status !== UNREACHABLE ? (
          <UpdateBuildroot
            robot={robot}
            close={() => setShowSoftwareUpdateModal(false)}
          />
        ) : null}
        {showDisconnectModal ? (
          <DisconnectModal
            onCancel={() => setShowDisconnectModal(false)}
            robotName={robot.name}
          />
        ) : null}
      </Portal>
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
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setShowOverflowMenu(false)
          }}
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
          {robot.status === CONNECTABLE ? (
            <MenuItem
              disabled={isRobotBusy || !canDisconnect}
              onClick={handleClickDisconnect}
            >
              {t('disconnect_from_network')}
            </MenuItem>
          ) : null}
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
