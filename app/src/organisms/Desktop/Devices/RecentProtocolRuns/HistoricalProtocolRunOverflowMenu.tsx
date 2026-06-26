import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  MenuItem,
  ModalHeader,
  ModalShell,
  NO_WRAP,
  OverflowBtn,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  PrimaryButton,
  SecondaryButton,
  SIZE_1,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'
import {
  useDeleteRunImages,
  useDeleteRunMutation,
} from '@opentrons/react-api-client'

import { getModalPortalEl } from '/app/App/portal'
import { Divider } from '/app/atoms/structure'
import { useRunControls } from '/app/organisms/RunTimeControl'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobot, useRobotType } from '/app/redux-resources/robots'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '/app/redux/analytics'
import { useIsRobotOnWrongVersionOfSoftware } from '/app/redux/robot-update'
import { useIsEstopNotDisengaged } from '/app/resources/devices'

import { useDownloadRunLog } from '../hooks'

import type { MouseEventHandler } from 'react'
import type { Run } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'

export interface HistoricalProtocolRunOverflowMenuProps {
  runId: string
  robotName: string
  robotIsBusy: boolean
  runHasImages: boolean
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
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const { downloadRunLog, isRunLogLoading } = useDownloadRunLog(
    robotName,
    runId
  )
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      data-testid="HistoricalProtocolRunOverflowMenu_OverflowMenu"
    >
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        onClick={handleOverflowClick}
        disabled={isEstopNotDisengaged}
      />
      {showOverflowMenu ? (
        <>
          <Box
            ref={protocolRunOverflowWrapperRef}
            data-testid={`HistoricalProtocolRunOverflowMenu_${runId}`}
          >
            <MenuDropdown
              {...props}
              downloadRunLog={downloadRunLog}
              isRunLogLoading={isRunLogLoading}
              closeOverflowMenu={handleOverflowClick}
            />
          </Box>
          {menuOverlay}
        </>
      ) : null}
    </Flex>
  )
}

interface MenuDropdownProps extends HistoricalProtocolRunOverflowMenuProps {
  closeOverflowMenu: MouseEventHandler<HTMLButtonElement>
  downloadRunLog: () => void
  isRunLogLoading: boolean
}
function MenuDropdown(props: MenuDropdownProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const navigate = useNavigate()

  const {
    runId,
    robotName,
    robotIsBusy,
    closeOverflowMenu,
    downloadRunLog,
    isRunLogLoading,
    runHasImages,
  } = props

  const isRobotOnWrongVersionOfSoftware =
    useIsRobotOnWrongVersionOfSoftware(robotName)
  const { mutateAsync: deleteRunImages } = useDeleteRunImages()

  const [targetProps, tooltipProps] = useHoverTooltip()
  const onResetSuccess = (createRunResponse: Run): void => {
    navigate(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
    )
  }
  const onDownloadClick: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
    closeOverflowMenu(e)
  }
  const trackEvent = useTrackEvent()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const { reset, isResetRunLoading, isRunControlLoading } = useRunControls(
    runId,
    onResetSuccess
  )
  const { deleteRun, isLoading: isDeletingImages } = useDeleteRunMutation()
  const robot = useRobot(robotName)
  const robotType = useRobotType(robotName)

  const robotSerialNumber =
    robot?.health?.robot_serial ?? robot?.serverHealth?.serialNumber ?? null
  const handleResetClick: MouseEventHandler<HTMLButtonElement> = (e): void => {
    e.preventDefault()
    e.stopPropagation()

    reset()
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: {
        sourceLocation: 'HistoricalProtocolRun',
        robotSerialNumber,
      },
    })
    trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN })
  }

  const handleDeleteClick: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    deleteRun(runId)
    closeOverflowMenu(e)
  }

  const onDeleteRunImages = (onClose: () => void): void => {
    void deleteRunImages(runId).finally(() => {
      onClose()
    })
  }
  const { reportPhotoAccessUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType: robotType,
  })
  const onClearRunImages: MouseEventHandler<HTMLButtonElement> = e => {
    handleDeleteRunImagesModal({ onDeleteRunImages })
    e.preventDefault()
    e.stopPropagation()
    closeOverflowMenu(e)

    reportPhotoAccessUsage({
      action: 'delete',
    })
  }

  return (
    <Flex
      whiteSpace={NO_WRAP}
      zIndex={10}
      borderRadius="4px 4px 0px 0px"
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.3rem"
      right={0}
      flexDirection={DIRECTION_COLUMN}
      width={FLEX_MAX_CONTENT}
    >
      <NavLink to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}>
        <MenuItem data-testid="RecentProtocolRun_OverflowMenu_viewRunRecord">
          {t('view_run_record')}
        </MenuItem>
      </NavLink>
      <MenuItem
        {...targetProps}
        onClick={handleResetClick}
        disabled={
          robotIsBusy || isRobotOnWrongVersionOfSoftware || isRunControlLoading
        }
        data-testid="RecentProtocolRun_OverflowMenu_rerunNow"
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          {t('rerun_now')}
          {isResetRunLoading ? (
            <Icon
              name="ot-spinner"
              size={SIZE_1}
              color={COLORS.grey50}
              aria-label="spinner"
              spin
            />
          ) : null}
        </Flex>
      </MenuItem>
      {isRobotOnWrongVersionOfSoftware && (
        <Tooltip tooltipProps={tooltipProps}>
          {t('shared:a_software_update_is_available')}
        </Tooltip>
      )}
      {isRunControlLoading && (
        <Tooltip whiteSpace="normal" tooltipProps={tooltipProps}>
          {t('rerun_loading')}
        </Tooltip>
      )}
      <MenuItem
        data-testid="RecentProtocolRun_OverflowMenu_downloadRunLog"
        disabled={isRunLogLoading}
        onClick={onDownloadClick}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          {t('download_run_log')}
          {isRunLogLoading ? (
            <Icon
              name="ot-spinner"
              size={SIZE_1}
              color={COLORS.grey50}
              aria-label="spinner"
              spin
            />
          ) : null}
        </Flex>
      </MenuItem>
      {runHasImages && (
        <MenuItem
          onClick={onClearRunImages}
          data-testid="RecentProtocolRun_OverflowMenu_clearRunImages"
          disabled={isDeletingImages}
        >
          {t('clear_run_images')}
        </MenuItem>
      )}
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

interface DeleteRunImagesModalProps {
  onDeleteRunImages: (onClose: () => void) => void
}

const handleDeleteRunImagesModal = (props: DeleteRunImagesModalProps): void => {
  NiceModal.show(DeleteRunImagesModal, props)
}

const DeleteRunImagesModal = NiceModal.create(
  ({ onDeleteRunImages }: DeleteRunImagesModalProps): JSX.Element => {
    const { t } = useTranslation('device_details')
    const modal = useModal()
    const [isDeleting, setIsDeleting] = useState(false)

    const onCancel = (): void => {
      modal.remove()
    }

    const onDelete = (): void => {
      if (!isDeleting) {
        setIsDeleting(true)
        onDeleteRunImages(modal.remove)
      }
    }

    const buildIcon = (): IconProps => {
      return {
        name: 'information',
        color: COLORS.yellow50,
        size: SPACING.spacing20,
        style: {
          marginRight: SPACING.spacing8,
        },
      }
    }

    const buildHeader = (): JSX.Element => {
      return (
        <ModalHeader
          title={t('clear_images_from_run_record')}
          icon={buildIcon()}
          color={COLORS.black90}
          backgroundColor={COLORS.white}
          onClose={onCancel}
        />
      )
    }

    return createPortal(
      <ModalShell header={buildHeader()} css={MODAL_STYLE}>
        <Flex
          padding={SPACING.spacing24}
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('all_images_deleted')}
          </StyledText>
          <Flex gridGap={SPACING.spacing8} justifyContent={JUSTIFY_END}>
            <SecondaryButton onClick={onCancel}>{t('cancel')}</SecondaryButton>
            <PrimaryButton onClick={onDelete}>
              <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing6}>
                {isDeleting && <Icon name="ot-spinner" spin size="1rem" />}
                {t('clear_images')}
              </Flex>
            </PrimaryButton>
          </Flex>
        </Flex>
      </ModalShell>,
      getModalPortalEl()
    )
  }
)

const MODAL_STYLE = css`
  width: 500px;
`
