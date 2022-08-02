import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { NavLink, useHistory } from 'react-router-dom'
import {
  Flex,
  POSITION_ABSOLUTE,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  COLORS,
  useOnClickOutside,
  useHoverTooltip,
  Box,
} from '@opentrons/components'
import {
  useDeleteRunMutation,
  useAllCommandsQuery,
} from '@opentrons/react-api-client'
import { Divider } from '../../atoms/structure'
import { Tooltip } from '../../atoms/Tooltip'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useRunControls } from '../RunTimeControl/hooks'
import { RUN_LOG_WINDOW_SIZE } from './constants'
import { DownloadRunLogToast } from './DownloadRunLogToast'
import { useTrackProtocolRunEvent } from './hooks'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'

import type { Run } from '@opentrons/api-client'
import type { State } from '../../redux/types'

export interface HistoricalProtocolRunOverflowMenuProps {
  runId: string
  robotName: string
  robotIsBusy: boolean
}

export function HistoricalProtocolRunOverflowMenu(
  props: HistoricalProtocolRunOverflowMenuProps
): JSX.Element {
  const { runId, robotName } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const protocolRunOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const [
    showDownloadRunLogToast,
    setShowDownloadRunLogToast,
  ] = React.useState<boolean>(false)

  const commands = useAllCommandsQuery(
    runId,
    { cursor: 0, pageLength: RUN_LOG_WINDOW_SIZE },
    { staleTime: Infinity }
  )
  const runTotalCommandCount = commands?.data?.meta?.totalLength

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      data-testid="HistoricalProtocolRunOverflowMenu_OverflowMenu"
    >
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu && (
        <>
          <Box
            ref={protocolRunOverflowWrapperRef}
            data-testid={`HistoricalProtocolRunOverflowMenu_${runId}`}
          >
            <MenuDropdown
              {...props}
              closeOverflowMenu={handleOverflowClick}
              setShowDownloadRunLogToast={setShowDownloadRunLogToast}
            />
          </Box>
          {menuOverlay}
        </>
      )}
      {runTotalCommandCount != null && showDownloadRunLogToast ? (
        <DownloadRunLogToast
          robotName={robotName}
          runId={runId}
          pageLength={runTotalCommandCount}
          onClose={() => setShowDownloadRunLogToast(false)}
        />
      ) : null}
    </Flex>
  )
}

interface MenuDropdownProps extends HistoricalProtocolRunOverflowMenuProps {
  closeOverflowMenu: React.MouseEventHandler<HTMLButtonElement>
  setShowDownloadRunLogToast: (showDownloadRunLogToastValue: boolean) => void
}
function MenuDropdown(props: MenuDropdownProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const history = useHistory()

  const {
    runId,
    robotName,
    robotIsBusy,
    closeOverflowMenu,
    setShowDownloadRunLogToast,
  } = props
  const isRobotOnWrongVersionOfSoftware = ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => {
      return getBuildrootUpdateDisplayInfo(state, robotName)
    })?.autoUpdateAction
  )
  const [targetProps, tooltipProps] = useHoverTooltip()
  const onResetSuccess = (createRunResponse: Run): void =>
    history.push(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-log`
    )
  const onDownloadClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowDownloadRunLogToast(true)
    closeOverflowMenu(e)
  }
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const { reset } = useRunControls(runId, onResetSuccess)
  const { deleteRun } = useDeleteRunMutation()

  const handleResetClick: React.MouseEventHandler<HTMLButtonElement> = (
    e
  ): void => {
    e.preventDefault()
    e.stopPropagation()

    reset()

    trackProtocolRunEvent({ name: 'runAgain' })
  }

  const handleDeleteClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    deleteRun(runId)
    closeOverflowMenu(e)
  }

  return (
    <Flex
      width="11.625rem"
      zIndex={10}
      borderRadius="4px 4px 0px 0px"
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.3rem"
      right={0}
      flexDirection={DIRECTION_COLUMN}
    >
      <NavLink to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}>
        <MenuItem data-testid="RecentProtocolRun_OverflowMenu_viewRunRecord">
          {t('view_run_record')}
        </MenuItem>
      </NavLink>
      <MenuItem
        {...targetProps}
        onClick={handleResetClick}
        disabled={robotIsBusy || isRobotOnWrongVersionOfSoftware}
        data-testid="RecentProtocolRun_OverflowMenu_rerunNow"
      >
        {t('rerun_now')}
      </MenuItem>
      {isRobotOnWrongVersionOfSoftware && (
        <Tooltip tooltipProps={tooltipProps}>
          {t('shared:a_software_update_is_available')}
        </Tooltip>
      )}
      <MenuItem
        data-testid="RecentProtocolRun_OverflowMenu_downloadRunLog"
        onClick={onDownloadClick}
      >
        {t('download_run_log')}
      </MenuItem>
      <Divider marginY="0" />
      <MenuItem
        onClick={handleDeleteClick}
        data-testid="RecentProtocolRun_OverflowMenu_deleteRun"
      >
        {t('delete_run')}
      </MenuItem>
    </Flex>
  )
}
