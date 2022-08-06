import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useTrackEvent } from '../../redux/analytics'
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
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Btn,
  useOnClickOutside,
} from '@opentrons/components'

import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { AlertPrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import { Modal } from '../../atoms/Modal'
import { Portal } from '../../App/portal'
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
  const overflowMenuRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const trackEvent = useTrackEvent()

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
    trackEvent({
      name: 'openLabwareCreatorFromLabwareOverflowMenu',
      properties: {},
    })
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
          zIndex={10}
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top={SPACING.spacing6}
          right={0}
          flexDirection={DIRECTION_COLUMN}
          whiteSpace="nowrap"
        >
          <MenuItem onClick={handleOpenInFolder}>
            {t('show_in_folder')}
          </MenuItem>
          <MenuItem onClick={handleClickDelete}>{t('delete')}</MenuItem>
          <Divider />
          <MenuItem onClick={handleClickLabwareCreator}>
            <StyledText css={TYPOGRAPHY.linkPSemiBold}>
              {t('open_labware_creator')}
              <Icon
                name="open-in-new"
                height={SPACING.spacingSM}
                marginLeft="0.375rem"
              ></Icon>
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
                marginTop={SPACING.spacing5}
              >
                <Btn
                  onClick={handleCancelModal}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  marginRight={SPACING.spacing5}
                  css={TYPOGRAPHY.linkPSemiBold}
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
