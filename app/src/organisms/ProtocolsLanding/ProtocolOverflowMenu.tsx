import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  useConditionalConfirm,
} from '@opentrons/components'
import { FLEX_DISPLAY_NAME } from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_DELETE_PROTOCOL_FROM_APP,
} from '../../redux/analytics'
import {
  analyzeProtocol,
  editProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../redux/protocol-storage'
import { ConfirmDeleteProtocolModal } from './ConfirmDeleteProtocolModal'

import type { StyleProps } from '@opentrons/components'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { Dispatch } from '../../redux/types'
import { useHistory } from 'react-router-dom'

interface ProtocolOverflowMenuProps extends StyleProps {
  handleRunProtocol: (storedProtocolData: StoredProtocolData) => void
  handleSendProtocolToOT3: (storedProtocolData: StoredProtocolData) => void
  storedProtocolData: StoredProtocolData
}

export function ProtocolOverflowMenu(
  props: ProtocolOverflowMenuProps
): JSX.Element {
  const {
    storedProtocolData,
    handleRunProtocol,
    handleSendProtocolToOT3,
  } = props
  const { protocolKey } = storedProtocolData
  const { t } = useTranslation(['protocol_list', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const trackEvent = useTrackEvent()
  const {
    confirm: confirmDeleteProtocol,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteProtocol,
  } = useConditionalConfirm(() => {
    dispatch(removeProtocol(protocolKey))
    trackEvent({ name: ANALYTICS_DELETE_PROTOCOL_FROM_APP, properties: {} })
  }, true)

  const handleClickShowInFolder: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(viewProtocolSourceFolder(protocolKey))
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickEdit: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(editProtocol(protocolKey))
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'ProtocolsLanding' },
    })
    handleRunProtocol(storedProtocolData)
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickSendToOT3: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    handleSendProtocolToOT3(storedProtocolData)
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickDelete: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    confirmDeleteProtocol()
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickReanalyze: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(analyzeProtocol(protocolKey))
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickTimeline: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    history.push(`/protocols/${protocolKey}/timeline`)
    setShowOverflowMenu(!showOverflowMenu)
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      onClick={e => e.stopPropagation()}
    >
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        onClick={handleOverflowClick}
        data-testid="ProtocolOverflowMenu_overflowBtn"
      />
      {showOverflowMenu ? (
        <Flex
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius="4px 4px 0px 0px"
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
          >
            {t('start_setup')}
          </MenuItem>
          <MenuItem
            onClick={handleClickReanalyze}
            data-testid="ProtocolOverflowMenu_reanalyze"
          >
            {t('shared:reanalyze')}
          </MenuItem>
          <MenuItem onClick={handleClickTimeline}>
            {t('go_to_timeline')}
          </MenuItem>
          <MenuItem
            onClick={handleClickSendToOT3}
            data-testid="ProtocolOverflowMenu_sendToOT3"
          >
            {t('protocol_list:send_to_robot_overflow', {
              robot_display_name: FLEX_DISPLAY_NAME,
            })}
          </MenuItem>
          <MenuItem
            onClick={handleClickShowInFolder}
            data-testid="ProtocolOverflowMenu_showInFolder"
          >
            {t('show_in_folder')}
          </MenuItem>
          <MenuItem onClick={handleClickEdit} >
            {t('edit')}
          </MenuItem>
          <MenuItem
            onClick={handleClickDelete}
            data-testid="ProtocolOverflowMenu_deleteProtocol"
          >
            {t('shared:delete')}
          </MenuItem>
        </Flex>
      ) : null}

      {showDeleteConfirmation ? (
        <Portal level="top">
          <ConfirmDeleteProtocolModal
            cancelDeleteProtocol={(e: React.MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              cancelDeleteProtocol()
            }}
            handleClickDelete={handleClickDelete}
          />
        </Portal>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
