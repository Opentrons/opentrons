import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  useConditionalConfirm,
} from '@opentrons/components'

import { Portal } from '../../App/portal'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { SendProtocolToOT3Slideout } from '../../organisms/SendProtocolToOT3Slideout'
import { useTrackEvent } from '../../redux/analytics'
import { getSendAllProtocolsToOT3 } from '../../redux/config'
import {
  analyzeProtocol,
  getStoredProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../redux/protocol-storage'
import { ConfirmDeleteProtocolModal } from './ConfirmDeleteProtocolModal'
import { getIsOT3Protocol } from './utils'

import type { StyleProps } from '@opentrons/components'
import type { Dispatch, State } from '../../redux/types'

interface ProtocolOverflowMenuProps extends StyleProps {
  protocolDisplayName: string
  protocolKey: string
  handleRunProtocol: () => void
}

export function ProtocolOverflowMenu(
  props: ProtocolOverflowMenuProps
): JSX.Element {
  const { protocolDisplayName, protocolKey, handleRunProtocol } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
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
  const sendAllProtocolsToOT3 = useSelector(getSendAllProtocolsToOT3)
  const [showSlideout, setShowSlideout] = React.useState<boolean>(false)
  const storedProtocolData = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )

  const isOT3Protocol = getIsOT3Protocol(storedProtocolData?.mostRecentAnalysis)

  const handleClickShowInFolder: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(viewProtocolSourceFolder(protocolKey))
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    trackEvent({
      name: 'proceedToRun',
      properties: { sourceLocation: 'ProtocolsLanding' },
    })
    handleRunProtocol()
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }
  const handleClickSendToOT3: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowSlideout(true)
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
            {t('run_now')}
          </MenuItem>
          <MenuItem
            onClick={handleClickReanalyze}
            data-testid="ProtocolOverflowMenu_reanalyze"
          >
            {t('shared:reanalyze')}
          </MenuItem>

          {sendAllProtocolsToOT3 || isOT3Protocol ? (
            <MenuItem
              onClick={handleClickSendToOT3}
              data-testid="ProtocolOverflowMenu_sendToOT3"
            >
              {t('send_to_ot3')}
            </MenuItem>
          ) : null}
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
      {storedProtocolData != null ? (
        <SendProtocolToOT3Slideout
          isExpanded={showSlideout}
          onCloseClick={() => setShowSlideout(false)}
          protocolDisplayName={protocolDisplayName}
          storedProtocolData={storedProtocolData}
        />
      ) : null}
    </Flex>
  )
}
