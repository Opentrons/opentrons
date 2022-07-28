import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useTrackEvent } from '../../redux/analytics'
import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  SIZE_4,
  useConditionalConfirm,
} from '@opentrons/components'

import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { Portal } from '../../App/portal'
import {
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../redux/protocol-storage'
import { ConfirmDeleteProtocolModal } from './ConfirmDeleteProtocolModal'

import type { StyleProps } from '@opentrons/components'
import type { Dispatch } from '../../redux/types'

interface ProtocolOverflowMenuProps extends StyleProps {
  protocolKey: string
  handleRunProtocol: () => void
}

export function ProtocolOverflowMenu(
  props: ProtocolOverflowMenuProps
): JSX.Element {
  const { protocolKey, handleRunProtocol } = props
  const { t } = useTranslation('protocol_list')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()
  const {
    confirm: confirmDeleteProtocol,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteProtocol,
  } = useConditionalConfirm(() => {
    dispatch(removeProtocol(protocolKey))
    trackEvent({ name: 'deleteProtocolFromApp', properties: {} })
  }, true)

  const handleClickShowInFolder: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(viewProtocolSourceFolder(protocolKey))
    setShowOverflowMenu(!showOverflowMenu)
  }
  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    handleRunProtocol()
    setShowOverflowMenu(!showOverflowMenu)
  }
  const handleClickDelete: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    confirmDeleteProtocol()
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
          width={SIZE_4}
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
            {t('run')}
          </MenuItem>
          <MenuItem
            onClick={handleClickShowInFolder}
            data-testid="ProtocolOverflowMenu_showInFolder"
          >
            {t('show_in_folder')}
          </MenuItem>
          <MenuItem
            onClick={handleClickDelete}
            data-testid="ProtocolOverflowMenu_deleteProtocol"
          >
            {t('delete_protocol')}
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
