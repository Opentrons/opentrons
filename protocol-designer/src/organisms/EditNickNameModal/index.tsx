import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import { getTopPortalEl } from '../../components/portals/TopPortal'
import { renameLabware } from '../../labware-ingred/actions'
import type { ThunkDispatch } from '../../types'

interface EditNickNameModalProps {
  labwareId: string
  onClose: () => void
}
export function EditNickNameModal(props: EditNickNameModalProps): JSX.Element {
  const { onClose, labwareId } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const nickNames = useSelector(uiLabwareSelectors.getLabwareNicknamesById)
  const savedNickname = nickNames[labwareId]
  const [nickName, setNickName] = React.useState<string>(savedNickname)
  const saveNickname = (): void => {
    dispatch(renameLabware({ labwareId, name: nickName }))
    onClose()
  }

  return createPortal(
    <Modal
      title={t('rename_labware')}
      type="info"
      onClose={onClose}
      footer={
        <Flex
          justifyContent={JUSTIFY_END}
          gridGap={SPACING.spacing8}
          padding={SPACING.spacing24}
        >
          <SecondaryButton
            onClick={() => {
              onClose()
            }}
          >
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton onClick={saveNickname}>
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        girGap={SPACING.spacing12}
        height="3.75rem"
      >
        <Flex color={COLORS.grey60}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('labware_name')}
          </StyledText>
        </Flex>
        <InputField
          error={nickName.length >= 115 ? t('rename_error') : null}
          data-testid="renameLabware_inputField"
          name="renameLabware"
          onChange={e => {
            setNickName(e.target.value)
          }}
          value={nickName}
          type="text"
          autoFocus
        />
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
