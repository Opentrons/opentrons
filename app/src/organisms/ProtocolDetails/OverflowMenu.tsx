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
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { Portal } from '../../App/portal'
import {
  analyzeProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../redux/protocol-storage'
import { ConfirmDeleteProtocolModal } from '../ProtocolsLanding/ConfirmDeleteProtocolModal'

import type { Dispatch } from '../../redux/types'

interface OverflowMenuProps {
  protocolKey: string
  protocolType: 'json' | 'python'
}

export function OverflowMenu(props: OverflowMenuProps): JSX.Element {
  const { protocolKey, protocolType } = props
  const { t } = useTranslation(['protocol_details', 'protocol_list', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const dispatch = useDispatch<Dispatch>()
  const {
    confirm: confirmDeleteProtocol,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteProtocol,
  } = useConditionalConfirm(() => dispatch(removeProtocol(protocolKey)), true)

  const handleClickShowInFolder: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(viewProtocolSourceFolder(protocolKey))
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickReanalyze: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(analyzeProtocol(protocolKey))
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  const handleClickDelete: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    confirmDeleteProtocol()
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn
        data-testid="ProtocolDetailsOverflowMenu_overflowBtn"
        alignSelf={ALIGN_FLEX_END}
        onClick={handleOverflowClick}
      />
      {showOverflowMenu ? (
        <Flex
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem
            onClick={handleClickShowInFolder}
            data-testid="ProtocolDetailsOverflowMenu_showInFolder"
          >
            {t('show_in_folder')}
          </MenuItem>
          <MenuItem
            onClick={handleClickReanalyze}
            data-testid="ProtocolDetailsOverflowMenu_reanalyze"
          >
            {t('shared:reanalyze')}
          </MenuItem>
          <MenuItem
            onClick={handleClickDelete}
            data-testid="ProtocolDetailsOverflowMenu_deleteProtocol"
          >
            {t('protocol_list:delete_protocol')}
          </MenuItem>
          {protocolType === 'json' ? (
            <>
              <Divider />
              <MenuItem>
                <ExternalLink
                  css={TYPOGRAPHY.linkPSemiBold}
                  href="https://designer.opentrons.com/"
                  id="Overflowmenu_protocol_designer"
                >
                  {t('protocol_info:launch_protocol_designer')}
                </ExternalLink>
              </MenuItem>
            </>
          ) : null}
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
