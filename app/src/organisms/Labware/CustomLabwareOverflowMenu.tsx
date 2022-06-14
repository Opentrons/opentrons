import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  useConditionalConfirm,
  SPACING,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Btn,
} from '@opentrons/components'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { AlertPrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import { Modal } from '../../atoms/Modal'
import { Portal } from '../../App/portal'
import { useCloseOnOutsideClick } from './hooks'
import {
  deleteCustomLabwareFile,
  openCustomLabwareDirectory,
} from '../../redux/custom-labware'
import type { Dispatch } from '../../redux/types'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create/'

interface CustomLabwareOverflowMenuProps {
  filename: string
  onDelete?: () => void
}

export function CustomLabwareOverflowMenu(
  props: CustomLabwareOverflowMenuProps
): JSX.Element {
  const { filename, onDelete } = props
  const { t } = useTranslation(['labware_landing', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const overflowMenuRef = React.useRef(null)
  useCloseOnOutsideClick(overflowMenuRef, () => setShowOverflowMenu(false))

  const {
    confirm: confirmDeleteLabware,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteLabware,
  } = useConditionalConfirm(() => {
    dispatch(deleteCustomLabwareFile(filename))
    onDelete?.()
  }, true)
  const handleOpenInFolder: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(false)
    dispatch(openCustomLabwareDirectory())
  }
  const handleClickDelete: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(false)
    confirmDeleteLabware()
  }
  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(!showOverflowMenu)
  }
  const handleClickLabwareCreator: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(false)
    window.open(LABWARE_CREATOR_HREF, '_blank')
  }

  const handleCancelModal: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    cancelDeleteLabware()
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn
        aria-label="CustomLabwareOverflowMenu_button"
        alignSelf={ALIGN_FLEX_END}
        onClick={handleOverflowClick}
      />
      {showOverflowMenu && (
        <Flex
          ref={overflowMenuRef}
          width="10rem"
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top={SPACING.spacing6}
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem onClick={handleOpenInFolder}>
            {t('show_in_folder')}
          </MenuItem>
          <MenuItem onClick={handleClickDelete}>{t('delete')}</MenuItem>
          <Divider />
          <MenuItem onClick={handleClickLabwareCreator}>
            <StyledText color={COLORS.blue}>
              {t('open_labware_creator')}
              <Icon name="open-in-new" height={SPACING.spacingSM}></Icon>
            </StyledText>
          </MenuItem>
        </Flex>
      )}
      {showDeleteConfirmation && (
        <Portal level="top">
          <Modal
            type="warning"
            title={t('delete_this_labware')}
            onClose={handleCancelModal}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p">{t('def_moved_to_trash')}</StyledText>
              <StyledText as="p" paddingTop={SPACING.spacing3}>
                {t('cannot-run-python-missing-labware')}
              </StyledText>
              <Flex
                justifyContent={JUSTIFY_FLEX_END}
                alignItems={ALIGN_CENTER}
                marginTop="24px"
              >
                <Btn
                  onClick={handleCancelModal}
                  textTransform={TEXT_TRANSFORM_CAPITALIZE}
                  marginRight={SPACING.spacing5}
                  css={TYPOGRAPHY.linkPSemiBold}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('shared:cancel')}
                </Btn>
                <AlertPrimaryButton onClick={handleClickDelete}>
                  {t('yes_delete_def')}
                </AlertPrimaryButton>
              </Flex>
            </Flex>
          </Modal>
        </Portal>
      )}
    </Flex>
  )
}
