import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { css } from 'styled-components'
import { useState } from 'react'

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
  useConditionalConfirm,
  useMenuHandleClickOutside,
} from '@opentrons/components'
import { FLEX_DISPLAY_NAME } from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  analyzeProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
  // NOTE: These are new actions you will need to create
  lockProtocol,
  unlockProtocol,
  verifyProtocolPassword,
} from '/app/redux/protocol-storage'

import { ConfirmDeleteProtocolModal } from './ConfirmDeleteProtocolModal'
// NOTE: This is a new component file you will need to create
import { PasswordModal } from './PasswordModal'

import type { MouseEvent } from 'react'
import type { StyleProps } from '@opentrons/components'
import type { StoredProtocolData } from '/app/redux/protocol-storage'
import type { Dispatch } from '/app/redux/types'

interface ProtocolOverflowMenuProps extends StyleProps {
  handleRunProtocol: (storedProtocolData: StoredProtocolData) => void
  handleSendProtocolToFlex: (storedProtocolData: StoredProtocolData) => void
  storedProtocolData: StoredProtocolData
}

export function ProtocolOverflowMenu(
  props: ProtocolOverflowMenuProps
): JSX.Element {
  const {
    storedProtocolData,
    handleRunProtocol,
    handleSendProtocolToFlex,
  } = props
  const { mostRecentAnalysis, protocolKey, isLocked } = storedProtocolData
  const { t } = useTranslation(['protocol_list', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordAction, setPasswordAction] = useState<{
    onConfirm: (password: string) => void
  } | null>(null)

  const handleCloseMenu = (): void => setShowOverflowMenu(false)

  const runProtectedAction = (action: () => void): void => {
    handleCloseMenu()
    if (isLocked) {
      setPasswordAction({
        onConfirm: password => {
          // NOTE: In a real implementation, this dispatch should likely return a promise
          // that resolves on success before running the action.
          dispatch(verifyProtocolPassword(protocolKey, password))
          action()
          setShowPasswordModal(false)
        },
      })
      setShowPasswordModal(true)
    } else {
      action()
    }
  }

  const {
    confirm: confirmDeleteProtocol,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteProtocol,
  } = useConditionalConfirm(
    () => { runProtectedAction(() => dispatch(removeProtocol(protocolKey))) },
    true
  )

  const robotType =
    mostRecentAnalysis != null ? mostRecentAnalysis?.robotType ?? null : null

  // UNPROTECTED ACTIONS
  const handleClickRun = (): void => {
    handleCloseMenu()
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'ProtocolsLanding' },
    })
    handleRunProtocol(storedProtocolData)
  }
  const handleClickSendToOT3 = (): void => {
    handleCloseMenu()
    handleSendProtocolToFlex(storedProtocolData)
  }
  const handleClickShowInFolder = (): void => {
    handleCloseMenu()
    dispatch(viewProtocolSourceFolder(protocolKey))
  }

  // PROTECTED ACTIONS
  const handleClickReanalyze = (): void => {
    runProtectedAction(() => dispatch(analyzeProtocol(protocolKey)))
  }
  const handleClickDelete = (): void => {
    runProtectedAction(() => confirmDeleteProtocol())
  }

  // NEW LOCK/UNLOCK HANDLERS
  const handleLock = (): void => {
    handleCloseMenu()
    setPasswordAction({
      onConfirm: password => {
        dispatch(lockProtocol(protocolKey, password))
        setShowPasswordModal(false)
      },
    })
    setShowPasswordModal(true)
  }
  const handleUnlock = (): void => {
    handleCloseMenu()
    setPasswordAction({
      onConfirm: password => {
        dispatch(unlockProtocol(protocolKey, password))
        setShowPasswordModal(false)
      },
    })
    setShowPasswordModal(true)
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      onClick={(e: MouseEvent) => {
        e.stopPropagation()
      }}
    >
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        onClick={handleOverflowClick}
        data-testid="ProtocolOverflowMenu_overflowBtn"
      />
      {showOverflowMenu ? (
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
          <MenuItem
            onClick={handleClickRun}
            data-testid="ProtocolOverflowMenu_run"
            css={css`
              border-radius: ${BORDERS.borderRadius8} ${BORDERS.borderRadius8} 0
                0;
            `}
          >
            {t('start_setup')}
          </MenuItem>
          {robotType !== 'OT-2 Standard' &&
            (isLocked ? (
              <MenuItem onClick={handleUnlock}>
                {t('protocol_list:unlock_protocol')}
              </MenuItem>
            ) : (
              <MenuItem onClick={handleLock}>
                {t('protocol_list:lock_protocol')}
              </MenuItem>
            ))}
          {!isLocked && (
            <MenuItem
              onClick={handleClickReanalyze}
              data-testid="ProtocolOverflowMenu_reanalyze"
            >
              {t('shared:reanalyze')}
            </MenuItem>
          )}
          {robotType !== 'OT-2 Standard' && (
            <MenuItem
              onClick={handleClickSendToOT3}
              data-testid="ProtocolOverflowMenu_sendToOT3"
            >
              {t('protocol_list:send_to_robot_overflow', {
                robot_display_name: FLEX_DISPLAY_NAME,
              })}
            </MenuItem>
          )}
          <MenuItem
            onClick={handleClickShowInFolder}
            data-testid="ProtocolOverflowMenu_showInFolder"
          >
            {t('show_in_folder')}
          </MenuItem>
          {!isLocked && (
            <MenuItem
              onClick={handleClickDelete}
              data-testid="ProtocolOverflowMenu_deleteProtocol"
              css={css`
                border-radius: 0 0 ${BORDERS.borderRadius8}
                  ${BORDERS.borderRadius8};
              `}
            >
              {t('shared:delete')}
            </MenuItem>
          )}
        </Flex>
      ) : null}

      {showPasswordModal && passwordAction != null
        ? createPortal(
            <PasswordModal
              onConfirm={passwordAction.onConfirm}
              onCancel={() => { setShowPasswordModal(false) }}
            />,
            getTopPortalEl()
          )
        : null}

      {showDeleteConfirmation
        ? createPortal(
            <ConfirmDeleteProtocolModal
              cancelDeleteProtocol={(e: MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                cancelDeleteProtocol()
              }}
              handleClickDelete={handleClickDelete}
            />,
            getTopPortalEl()
          )
        : null}
      {menuOverlay}
    </Flex>
  )
}