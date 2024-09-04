import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useForm } from 'react-hook-form'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../components/portals/TopPortal'
import { InputField } from '../../components/modals/CreateFileWizard/InputField'
import { actions, selectors as fileSelectors } from '../../file-data'
import type { FileMetadataFields } from '../../file-data'

interface EditProtocolMetadataModalProps {
  onClose: () => void
}
export function EditProtocolMetadataModal(
  props: EditProtocolMetadataModalProps
): JSX.Element {
  const { onClose } = props
  const dispatch = useDispatch()
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const formValues = useSelector(fileSelectors.getFileMetadata)
  const {
    handleSubmit,
    watch,
    register,
    formState: { isDirty },
  } = useForm<FileMetadataFields>({ defaultValues: formValues })
  const [protocolName, author, description] = watch([
    'protocolName',
    'author',
    'description',
  ])

  const saveFileMetadata = (nextFormValues: FileMetadataFields): void => {
    dispatch(actions.saveFileMetadata(nextFormValues))
    onClose()
  }

  return createPortal(
    <Modal
      title={t('shared:edit_protocol_metadata')}
      type="info"
      closeOnOutsideClick
      onClose={onClose}
      footer={
        <Flex
          justifyContent={JUSTIFY_END}
          gridGap={SPACING.spacing8}
          padding={SPACING.spacing24}
        >
          <SecondaryButton onClick={onClose}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton
            data-testid="EditProtocolMetadataModal_saveButton"
            disabled={!isDirty}
            onClick={() => {
              handleSubmit(saveFileMetadata)()
            }}
          >
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(saveFileMetadata)}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <Flex color={COLORS.grey60}>
              <StyledText desktopStyle="captionRegular">{t('name')}</StyledText>
            </Flex>
            <InputField
              placeholder={protocolName}
              autoFocus
              register={register}
              fieldName="protocolName"
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <Flex color={COLORS.grey60}>
              <StyledText desktopStyle="captionRegular">
                {t('description')}
              </StyledText>
            </Flex>
            <DescriptionField
              placeholder={description ?? ''}
              {...register('description')}
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <Flex color={COLORS.grey60}>
              <StyledText desktopStyle="captionRegular">
                {t('author_org')}
              </StyledText>
            </Flex>
            <InputField
              placeholder={author ?? ''}
              fieldName="author"
              register={register}
            />
          </Flex>
        </Flex>
      </form>
    </Modal>,
    getTopPortalEl()
  )
}

const DescriptionField = styled.textarea`
  min-height: 5rem;
  width: 100%;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8};
  font-size: ${TYPOGRAPHY.fontSizeP};
  resize: none;
`
