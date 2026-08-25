import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_END,
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
  TYPOGRAPHY,
  useHoverTooltip,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { Divider } from '/app/atoms/structure'
import { ChooseProtocolSlideout } from '/app/organisms/Desktop/ChooseProtocolSlideout'
import { useIsRobotBusy } from '/app/redux-resources/robots'
import { CONNECTABLE, removeRobot } from '/app/redux/discovery'
import { useIsRobotOnWrongVersionOfSoftware } from '/app/redux/robot-update'
import { useIsRobotOutOfStorage } from '/app/resources/devices'
import { useCurrentRunId } from '/app/resources/runs'

import { ConnectionTroubleshootingModal } from './ConnectionTroubleshootingModal'
import { RobotOutOfStorageModal } from './RobotOutOfStorageModal.tsx'

import type { MouseEvent, MouseEventHandler, ReactNode } from 'react'
import type { StyleProps } from '@opentrons/components'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { Dispatch } from '/app/redux/types'

interface RobotOverflowMenuProps extends StyleProps {
  robot: DiscoveredRobot
}

export function RobotOverflowMenu(props: RobotOverflowMenuProps): ReactNode {
  const { robot, ...styleProps } = props
  const { t } = useTranslation(['devices_landing', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const dispatch = useDispatch<Dispatch>()
  const runId = useCurrentRunId({ enabled: robot.status === CONNECTABLE })
  const [showChooseProtocolSlideout, setShowChooseProtocolSlideout] =
    useState<boolean>(false)
  const [
    showConnectionTroubleshootingModal,
    setShowConnectionTroubleshootingModal,
  ] = useState<boolean>(false)

  const isRobotOnWrongVersionOfSoftware = useIsRobotOnWrongVersionOfSoftware(
    robot.name
  )

  const isRobotBusy = useIsRobotBusy({ poll: true })

  const isRobotOutOfStorage = useIsRobotOutOfStorage()
  const [showRobotOutOfStorageModal, setShowRobotOutOfStorageModal] =
    useState<boolean>(false)
  const navigate = useNavigate()

  const handleClickRun: MouseEventHandler<HTMLButtonElement> = e => {
    if (isRobotOutOfStorage) {
      setShowRobotOutOfStorageModal(true)
    } else {
      e.preventDefault()
      e.stopPropagation()
      setShowChooseProtocolSlideout(true)
    }
    setShowOverflowMenu(false)
  }
  const handleClickConnectionTroubleshooting: MouseEventHandler<
    HTMLButtonElement
  > = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowConnectionTroubleshootingModal(true)
    setShowOverflowMenu(false)
  }

  let menuItems: ReactNode
  if (robot.status === CONNECTABLE && runId == null) {
    menuItems = (
      <>
        <MenuItem
          {...targetProps}
          onClick={handleClickRun}
          disabled={isRobotOnWrongVersionOfSoftware || isRobotBusy}
          data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
          css={css`
            border-radius: ${BORDERS.borderRadius8} ${BORDERS.borderRadius8} 0 0;
          `}
        >
          {t('run_a_protocol')}
        </MenuItem>
        {isRobotOnWrongVersionOfSoftware && (
          <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
            {t('shared:a_software_update_is_available')}
          </Tooltip>
        )}
        {!isRobotOnWrongVersionOfSoftware && isRobotBusy && (
          <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
            {t('shared:robot_is_busy')}
          </Tooltip>
        )}
        <Divider marginY="0" />
        <MenuItem
          to={`/devices/${robot.name}/robot-settings`}
          as={Link}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          css={css`
            border-radius: 0 0 ${BORDERS.borderRadius8} ${BORDERS.borderRadius8};
          `}
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
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        css={css`
          border-radius: ${BORDERS.borderRadius8};
        `}
      >
        {t('robot_settings')}
      </MenuItem>
    )
  } else {
    menuItems = (
      <>
        <MenuItem
          onClick={handleClickConnectionTroubleshooting}
          css={css`
            border-radius: ${BORDERS.borderRadius8} ${BORDERS.borderRadius8} 0 0;
          `}
        >
          {t('why_is_this_robot_unavailable')}
        </MenuItem>
        <MenuItem
          onClick={() => dispatch(removeRobot(robot.name))}
          css={css`
            border-radius: 0 0 ${BORDERS.borderRadius8} ${BORDERS.borderRadius8};
          `}
        >
          {t('forget_unavailable_robot')}
        </MenuItem>
      </>
    )
  }
  return (
    <>
      {showRobotOutOfStorageModal
        ? createPortal(
            <RobotOutOfStorageModal
              onConfirm={() => {
                navigate(`/devices/${robot.name}/robot-settings/file-manager`)
              }}
              onClose={() => {
                setShowRobotOutOfStorageModal(false)
              }}
            />,
            getTopPortalEl()
          )
        : null}

      <Flex
        data-testid={`RobotCard_${String(robot.name)}_overflowMenu`}
        flexDirection={DIRECTION_COLUMN}
        position={POSITION_RELATIVE}
        onClick={(e: MouseEvent) => {
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
            whiteSpace={NO_WRAP}
            zIndex={10}
            borderRadius={BORDERS.borderRadius8}
            boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
            position={POSITION_ABSOLUTE}
            backgroundColor={COLORS.white}
            top="2.25rem"
            right="0"
            flexDirection={DIRECTION_COLUMN}
          >
            {menuItems}
          </Flex>
        ) : null}
        {showChooseProtocolSlideout && robot.status === CONNECTABLE ? (
          <ChooseProtocolSlideout
            robot={robot}
            showSlideout={showChooseProtocolSlideout}
            onCloseClick={() => {
              setShowChooseProtocolSlideout(false)
            }}
          />
        ) : null}
        {createPortal(
          <>
            {showOverflowMenu && menuOverlay}
            {showConnectionTroubleshootingModal ? (
              <ConnectionTroubleshootingModal
                onClose={() => {
                  setShowConnectionTroubleshootingModal(false)
                }}
              />
            ) : null}
          </>,
          getTopPortalEl()
        )}
      </Flex>
    </>
  )
}
