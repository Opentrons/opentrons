import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useHistory } from 'react-router-dom'
import {
  Flex,
  SPACING,
  POSITION_ABSOLUTE,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  COLORS,
  useOnClickOutside,
} from '@opentrons/components'
import {
  useDeleteRunMutation,
  useAllCommandsQuery,
} from '@opentrons/react-api-client'
import { Divider } from '../../atoms/structure'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useRunControls } from '../RunTimeControl/hooks'
import { RUN_LOG_WINDOW_SIZE } from './constants'
import { DownloadRunLogToast } from './DownloadRunLogToast'
import { useTrackEvent } from '../../redux/analytics'
import { useProtocolRunAnalyticsData } from './hooks'
import type { Run } from '@opentrons/api-client'

export interface HistoricalProtocolRunOverflowMenuProps {
  runId: string
  robotName: string
  robotIsBusy: boolean
}

export function HistoricalProtocolRunOverflowMenu(
  props: HistoricalProtocolRunOverflowMenuProps
): JSX.Element {
  const { runId, robotName } = props
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const protocolRunOverflowWrapperRef = useOnClickOutside({
    onClickOutside: () => setShowOverflowMenu(false),
  }) as React.RefObject<HTMLDivElement>
  const [
    showDownloadRunLogToast,
    setShowDownloadRunLogToast,
  ] = React.useState<boolean>(false)
  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(!showOverflowMenu)
  }

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
        <div
          ref={protocolRunOverflowWrapperRef}
          data-testid={`HistoricalProtocolRunOverflowMenu_${runId}`}
        >
          <MenuDropdown
            {...props}
            closeOverflowMenu={handleOverflowClick}
            setShowDownloadRunLogToast={setShowDownloadRunLogToast}
          />
        </div>
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
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(runId)

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
  const trackEvent = useTrackEvent()
  const { reset } = useRunControls(runId, onResetSuccess)
  const { deleteRun } = useDeleteRunMutation()

  const handleResetClick: React.MouseEventHandler<HTMLButtonElement> = async (
    e
  ): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    reset()

    const { protocolRunAnalyticsData } = await getProtocolRunAnalyticsData()

    trackEvent({
      name: 'runAgain',
      properties: { ...protocolRunAnalyticsData },
    })
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
      borderRadius={'4px 4px 0px 0px'}
      boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top={SPACING.spacing6}
      right={0}
      flexDirection={DIRECTION_COLUMN}
      height="10.5rem"
    >
      <NavLink to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}>
        <MenuItem data-testid={`RecentProtocolRun_OverflowMenu_viewRunRecord`}>
          {t('view_run_record')}
        </MenuItem>
      </NavLink>
      <MenuItem
        onClick={handleResetClick}
        disabled={robotIsBusy}
        data-testid={`RecentProtocolRun_OverflowMenu_rerunNow`}
      >
        {t('rerun_now')}
      </MenuItem>
      <MenuItem
        data-testid={`RecentProtocolRun_OverflowMenu_downloadRunLog`}
        onClick={onDownloadClick}
      >
        {t('download_run_log')}
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={handleDeleteClick}
        data-testid={`RecentProtocolRun_OverflowMenu_deleteRun`}
      >
        {t('delete_run')}
      </MenuItem>
    </Flex>
  )
}
