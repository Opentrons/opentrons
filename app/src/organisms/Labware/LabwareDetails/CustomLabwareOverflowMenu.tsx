import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  useConditionalConfirm,
  AlertModal,
  SPACING,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { AlertPrimaryButton, SecondaryButton } from '../../../atoms/Buttons'
import { StyledText } from '../../../atoms/text'
import { Divider } from '../../../atoms/structure'
import { Portal } from '../../../App/portal'
import {
  deleteCustomLabwareFile,
  openCustomLabwareDirectory,
} from '../../../redux/custom-labware'
import type { Dispatch } from '../../../redux/types'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create/'

interface CustomLabwareOverflowMenuProps {
  filename: string
}

export function CustomLabwareOverflowMenu(
  props: CustomLabwareOverflowMenuProps
): JSX.Element {
  const { filename } = props
  const { t } = useTranslation(['labware_landing'])
  const dispatch = useDispatch<Dispatch>()
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)

  const {
    confirm: confirmDeleteLabware,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDeleteLabware,
  } = useConditionalConfirm(
    () => dispatch(deleteCustomLabwareFile(filename)),
    true
  )
  const handleOpenInFolder: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(openCustomLabwareDirectory())
  }
  const handleClickDelete: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
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
    window.open(LABWARE_CREATOR_HREF, '_blank')
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu && (
        <Flex
          width="10rem"
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2rem"
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
              <Icon name="open-in-new" height="10px"></Icon>
            </StyledText>
          </MenuItem>
        </Flex>
      )}
      {showDeleteConfirmation && (
        <Portal level="top">
          <AlertModal
            heading={t('delete_this_labware')}
            buttons={[
              {
                Component: () => (
                  <SecondaryButton
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      cancelDeleteLabware()
                    }}
                    textTransform={TEXT_TRANSFORM_CAPITALIZE}
                  >
                    {t('cancel')}
                  </SecondaryButton>
                ),
              },
              {
                Component: () => (
                  <AlertPrimaryButton
                    onClick={handleClickDelete}
                    marginLeft={SPACING.spacing3}
                  >
                    {t('yes_delete_def')}
                  </AlertPrimaryButton>
                ),
              },
            ]}
            alertOverlay
          >
            <StyledText as="p">{t('delete_labware_description')}</StyledText>
          </AlertModal>
        </Portal>
      )}
    </Flex>
  )
}
