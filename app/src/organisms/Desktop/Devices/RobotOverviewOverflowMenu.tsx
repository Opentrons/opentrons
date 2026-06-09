import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  MenuItem,
  NO_WRAP,
  OverflowBtn,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  Tooltip,
  useHoverTooltip,
  useMenuHandleClickOutside,
  useMountEffect,
} from '@opentrons/components'
import {
  useCreateLiveCommandMutation,
  useHomeMutation,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { Divider } from '/app/atoms/structure'
import { ChooseProtocolSlideout } from '/app/organisms/Desktop/ChooseProtocolSlideout'
import { RobotCertImportModal } from '/app/organisms/Desktop/RobotCertImport/RobotCertImportModal'
import { useIsFlex, useIsRobotBusy } from '/app/redux-resources/robots'
import * as Config from '/app/redux/config'
import { CONNECTABLE, REACHABLE, UNREACHABLE } from '/app/redux/discovery'
import { restartRobot, shutdownRobot } from '/app/redux/robot-admin'
import { useIsRobotOnWrongVersionOfSoftware } from '/app/redux/robot-update'
import { checkShellUpdate } from '/app/redux/shell'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useCanDisconnect } from '/app/resources/networking/hooks'
import { useCurrentRunId } from '/app/resources/runs'

import { DisconnectModal } from './RobotSettings/ConnectNetwork/DisconnectModal'
import { handleUpdateBuildroot } from './RobotSettings/UpdateBuildroot'

import type { MouseEvent, MouseEventHandler } from 'react'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { Dispatch } from '/app/redux/types'

interface RobotOverviewOverflowMenuProps {
  robot: DiscoveredRobot
}

export const RobotOverviewOverflowMenu = (
  props: RobotOverviewOverflowMenuProps
): JSX.Element => {
  const { robot } = props
  const { t } = useTranslation([
    'devices_landing',
    'robot_controls',
    'shared',
    'device_settings',
  ])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const navigate = useNavigate()
  const isRobotBusy = useIsRobotBusy()
  const runId = useCurrentRunId()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robot.name)

  const dispatch = useDispatch<Dispatch>()
  const isFlex = useIsFlex(robot.name)
  const { setLights } = useSetLightsMutation()
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { home } = useHomeMutation()

  const handleClickRestart: MouseEventHandler<HTMLButtonElement> = () => {
    dispatch(restartRobot(robot.name))
  }

  const handleClickShutdown: MouseEventHandler<HTMLButtonElement> = () => {
    createLiveCommand({
      command: { commandType: 'setStatusBar', params: { animation: 'off' } },
    })
      .catch(() => {
        console.warn('Failed to set status bar animation to off')
      })
      .finally(() => {
        setLights({ on: false })
        dispatch(shutdownRobot(robot.name))
      })
  }

  const handleClickHomeGantry: MouseEventHandler<HTMLButtonElement> = () => {
    home({ target: 'robot' })
  }

  const [showChooseProtocolSlideout, setShowChooseProtocolSlideout] =
    useState<boolean>(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false)

  const canDisconnect = useCanDisconnect(robot.name)

  const handleClickDisconnect: MouseEventHandler<HTMLButtonElement> = () => {
    setShowDisconnectModal(true)
  }

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const handleClickRun: MouseEventHandler<HTMLButtonElement> = () => {
    setShowChooseProtocolSlideout(true)
  }

  const isRobotOnWrongVersionOfSoftware = useIsRobotOnWrongVersionOfSoftware(
    robot.name
  )
  const isRobotUnavailable = isRobotBusy || robot?.status !== CONNECTABLE
  const isUpdateSoftwareItemVisible =
    isRobotOnWrongVersionOfSoftware &&
    !isRobotUnavailable &&
    !isEstopNotDisengaged
  const [showRobotCertImportModal, setShowRobotCertImportModal] =
    useState<boolean>(false)
  const devInternalFlags = useSelector(Config.getFeatureFlags)

  return (
    <Flex data-testid="RobotOverview_overflowMenu" position={POSITION_RELATIVE}>
      {showDisconnectModal
        ? createPortal(
            <DisconnectModal
              onCancel={() => {
                setShowDisconnectModal(false)
              }}
              robotName={robot.name}
            />,
            getTopPortalEl()
          )
        : null}
      {showRobotCertImportModal
        ? createPortal(
            <RobotCertImportModal
              onClose={() => {
                setShowRobotCertImportModal(false)
              }}
            />,
            getTopPortalEl()
          )
        : null}
      <OverflowBtn aria-label="overflow" onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          whiteSpace={NO_WRAP}
          zIndex={10}
          borderRadius={BORDERS.borderRadius8}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.25rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setShowOverflowMenu(false)
          }}
        >
          {isUpdateSoftwareItemVisible ? (
            <MenuItem
              onClick={() => {
                handleUpdateBuildroot(robot)
              }}
              data-testid={`RobotOverviewOverflowMenu_updateSoftware_${String(
                robot.name
              )}`}
              css={css`
                border-radius: ${BORDERS.borderRadius8} ${BORDERS.borderRadius8}
                  0 0;
              `}
            >
              {t('update_robot_software')}
            </MenuItem>
          ) : null}
          {robot.status === CONNECTABLE && runId == null ? (
            <>
              <MenuItem
                {...targetProps}
                onClick={handleClickRun}
                disabled={
                  isRobotOnWrongVersionOfSoftware ||
                  isRobotBusy ||
                  isEstopNotDisengaged
                }
                data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
                css={
                  !isUpdateSoftwareItemVisible
                    ? css`
                        border-radius: ${BORDERS.borderRadius8}
                          ${BORDERS.borderRadius8} 0 0;
                      `
                    : undefined
                }
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
            disabled={isRobotUnavailable || isEstopNotDisengaged}
            onClick={handleClickHomeGantry}
            data-testid={`RobotOverviewOverflowMenu_homeGantry_${String(
              robot.name
            )}`}
          >
            {t('home_gantry')}
          </MenuItem>
          {robot.status === CONNECTABLE ? (
            <MenuItem
              disabled={isRobotBusy || !canDisconnect || isEstopNotDisengaged}
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
          {isFlex ? (
            <MenuItem
              disabled={isRobotUnavailable || isEstopNotDisengaged}
              onClick={handleClickShutdown}
              data-testid={`RobotOverviewOverflowMenu_shutdownRobot_${String(
                robot.name
              )}`}
            >
              {t('robot_controls:turn_off_label')}
            </MenuItem>
          ) : null}
          <Divider marginY="0" />
          <MenuItem
            onClick={() => {
              navigate(`/devices/${robot.name}/robot-settings`)
            }}
            disabled={
              robot == null ||
              robot?.status === UNREACHABLE ||
              (robot?.status === REACHABLE &&
                robot?.serverHealthStatus !== 'ok')
            }
            data-testid={`RobotOverviewOverflowMenu_robotSettings_${String(
              robot.name
            )}`}
            css={css`
              border-radius: 0 0 ${BORDERS.borderRadius8}
                ${BORDERS.borderRadius8};
            `}
          >
            {t('robot_settings')}
          </MenuItem>
          {!!devInternalFlags.accessControlMode ? (
            <MenuItem
              onClick={() => {
                setShowRobotCertImportModal(true)
              }}
              data-testid={`RobotOverviewOverflowMenu_robotCertImport_${String(robot.name)}`}
              css={css`
                border-radius: 0 0 ${BORDERS.borderRadius8}
                  ${BORDERS.borderRadius8};
              `}
            >
              {t('device_settings:verify_robot_encryption_key')}
            </MenuItem>
          ) : null}
        </Flex>
      ) : null}
      {robot.status === CONNECTABLE ? (
        <ChooseProtocolSlideout
          robot={robot}
          showSlideout={showChooseProtocolSlideout}
          onCloseClick={() => {
            setShowChooseProtocolSlideout(false)
          }}
        />
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
