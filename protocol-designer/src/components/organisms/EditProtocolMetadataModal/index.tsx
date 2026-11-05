import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

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
  TextAreaField,
} from '@opentrons/components'

import {
  actions,
  selectors as fileSelectors,
} from '/protocol-designer/file-data'

import { getMainPagePortalEl } from '../Portal'

import type { ReactNode } from 'react'
import type { FileMetadataFields } from '/protocol-designer/file-data'

interface EditProtocolMetadataModalProps {
  onClose: () => void
}
export function EditProtocolMetadataModal(
  props: EditProtocolMetadataModalProps
): ReactNode {
  const { onClose } = props
  const dispatch = useDispatch()
  const { t } = useTranslation(['onboarding', 'shared'])
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
      onClose={onClose}
      childrenPadding={SPACING.spacing24}
      footer={
        <Flex
          justifyContent={JUSTIFY_END}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap={SPACING.spacing8}
        >
          <SecondaryButton onClick={onClose}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton
            disabled={!isDirty}
            onClick={() => {
              void handleSubmit(saveFileMetadata)()
            }}
          >
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
      }
    >
      <form
        onSubmit={() => {
          void handleSubmit(saveFileMetadata)
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
              {t('name')}
            </StyledText>
            <InputField
              autoFocus
              {...register('protocolName')}
              placeholder={protocolName}
              value={watch('protocolName')}
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <TextAreaField
              label={t('description')}
              value={description ?? ''}
              {...register('description')}
              height="6rem"
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
              {t('author_org')}
            </StyledText>
            <InputField
              placeholder={author ?? ''}
              {...register('author')}
              value={watch('author')}
            />
          </Flex>
        </Flex>
      </form>
    </Modal>,
    getMainPagePortalEl()
  )
}
