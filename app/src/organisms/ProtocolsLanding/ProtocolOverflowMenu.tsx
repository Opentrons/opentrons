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
  AlertModal,
  SPACING,
} from '@opentrons/components'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { removeProtocol } from '../../redux/protocol-storage'

import type { StyleProps } from '@opentrons/components'
import type { Dispatch } from '../../redux/types'
import { PrimaryButton, SecondaryButton } from '../../atoms/Buttons'

interface ProtocolOverflowMenuProps extends StyleProps {
  protocolKey: string
}

export function ProtocolOverflowMenu(
  props: ProtocolOverflowMenuProps
): JSX.Element {
  const { protocolKey } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const {
    confirm: confirmDeleteProtocol,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteProtocol,
  } = useConditionalConfirm(() => dispatch(removeProtocol(protocolKey)), true)

  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    console.log('TODO: handle run protocol')
  }
  const handleClickDelete: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    confirmDeleteProtocol()
  }
  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(!showOverflowMenu)
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          width={SIZE_4}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem onClick={handleClickRun}>{t('run')}</MenuItem>
          <MenuItem onClick={handleClickDelete}>
            {t('delete_protocol')}
          </MenuItem>
        </Flex>
      ) : null}

      {showDeleteConfirmation ? (
        <Portal level="top">
          <AlertModal
            heading={t('should_delete_this_protocol')}
            buttons={[
              {
                Component: () => (
                  <SecondaryButton
                    onClick={e => {
                      e.preventDefault()
                      cancelDeleteProtocol()
                    }}
                  >
                    {t('shared:cancel')}
                  </SecondaryButton>
                ),
              },
              {
                Component: () => (
                  <PrimaryButton
                    onClick={handleClickDelete}
                    marginLeft={SPACING.spacing3}
                  >
                    {t('yes_delete_this_protocol')}
                  </PrimaryButton>
                ),
              },
            ]}
            alertOverlay
          >
            <p>{t('this_protocol_will_be_trashed')}</p>
          </AlertModal>
        </Portal>
      ) : null}
    </Flex>
  )
}
