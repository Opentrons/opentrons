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
  SIZE_4,
  useConditionalConfirm,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Link,
} from '@opentrons/components'

import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { AlertPrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../atoms/Modal'
import { Portal } from '../../App/portal'
import {
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../redux/protocol-storage'

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
  const { t } = useTranslation(['protocol_list', 'shared'])
  const {
    MenuOverlay,
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
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="3.25rem"
          right={0}
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
          <Modal
            type="warning"
            onClose={(e: React.MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              cancelDeleteProtocol()
            }}
            title={t('should_delete_this_protocol')}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" marginBottom={SPACING.spacing5}>
                {t('this_protocol_will_be_trashed')}
              </StyledText>
              <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
                <Link
                  role="button"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    cancelDeleteProtocol()
                  }}
                  textTransform={TEXT_TRANSFORM_CAPITALIZE}
                  marginRight={SPACING.spacing5}
                  css={TYPOGRAPHY.linkPSemiBold}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('shared:cancel')}
                </Link>
                <AlertPrimaryButton
                  backgroundColor={COLORS.error}
                  onClick={handleClickDelete}
                >
                  {t('yes_delete_this_protocol')}
                </AlertPrimaryButton>
              </Flex>
            </Flex>
          </Modal>
        </Portal>
      ) : null}
      <MenuOverlay />
    </Flex>
  )
}
