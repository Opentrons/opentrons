import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  HandleEnter,
  LINK_BUTTON_STYLE,
} from '/protocol-designer/components/atoms'
import { renameLabware } from '/protocol-designer/labware-ingred/actions'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import { selectors as uiLabwareSelectors } from '/protocol-designer/ui/labware'

import { getMainPagePortalEl } from '../Portal'

import type { ThunkDispatch } from '/protocol-designer/types'

const MAX_NICK_NAME_LENGTH = 115
interface EditNickNameModalProps {
  labwareId: string
  onClose: () => void
}
export function EditNickNameModal(props: EditNickNameModalProps): JSX.Element {
  const { onClose, labwareId } = props
  const { t } = useTranslation(['onboarding', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const labwareEntities = useSelector(getLabwareEntities)
  const displayName = labwareEntities[labwareId].def.metadata.displayName
  const nickNames = useSelector(uiLabwareSelectors.getLabwareNicknamesById)
  const savedNickname = nickNames[labwareId]
  const [nickName, setNickName] = useState<string>(savedNickname)
  const saveNickname = (name: string): void => {
    dispatch(renameLabware({ labwareId, name }))
    onClose()
  }
  const showResetButton = displayName !== nickName

  return createPortal(
    <HandleEnter
      onEnter={() => {
        saveNickname(nickName)
      }}
    >
      <Modal
        title={t('rename_labware')}
        type="info"
        onClose={onClose}
        footer={
          <Flex
            justifyContent={
              showResetButton ? JUSTIFY_SPACE_BETWEEN : JUSTIFY_END
            }
            padding={SPACING.spacing24}
          >
            {showResetButton ? (
              <Btn
                css={LINK_BUTTON_STYLE}
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                onClick={() => {
                  setNickName(displayName)
                }}
              >
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('shared:reset')}
                </StyledText>
              </Btn>
            ) : null}
            <Flex gridGap={SPACING.spacing8}>
              <SecondaryButton
                onClick={() => {
                  onClose()
                }}
              >
                {t('shared:cancel')}
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  saveNickname(nickName)
                }}
                disabled={nickName.length >= MAX_NICK_NAME_LENGTH}
              >
                {t('shared:save')}
              </PrimaryButton>
            </Flex>
          </Flex>
        }
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          height="3.75rem"
        >
          <Flex color={COLORS.grey60}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('labware_name')}
            </StyledText>
          </Flex>
          <InputField
            error={
              nickName.length >= MAX_NICK_NAME_LENGTH ? t('rename_error') : null
            }
            name="renameLabware"
            onChange={e => {
              setNickName(e.target.value)
            }}
            value={nickName}
            type="text"
            autoFocus
          />
        </Flex>
      </Modal>
    </HandleEnter>,
    getMainPagePortalEl()
  )
}
