import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { ReactNode } from 'react'
import type { FileUploadMessage } from '/protocol-designer/load-file'

export interface ModalContents {
  title: string
  body: ReactNode
}

interface InvalidModalProps {
  t: any
  type: 'general' | 'python'
  errorMessage?: string | null
}

const getInvalidFileType = (props: InvalidModalProps): ModalContents => {
  const { t, type } = props
  return {
    title:
      type === 'general'
        ? t('incorrect_file_header')
        : t('incorrect_python_file_header'),
    body: (
      <StyledText desktopStyle="bodyDefaultRegular">
        {type === 'general'
          ? t('incorrect_file_type_body')
          : t('incorrect_python_file_type_body')}
      </StyledText>
    ),
  }
}

const invalidJsonModal = (props: InvalidModalProps): ModalContents => {
  const { t, errorMessage, type } = props
  return {
    title:
      type === 'general'
        ? t('invalid_json_file')
        : t('incorrect_python_file_header'),
    body: (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {type === 'general'
            ? t('invalid_json_file_body')
            : t('invalid_python_body')}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          marginTop={SPACING.spacing8}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('invalid_file_error')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.red50}>
            {errorMessage}
          </StyledText>
        </Flex>
      </Flex>
    ),
  }
}

export const getMigrationMessage = (props: { t: any }): ModalContents => {
  const { t } = props

  return {
    title: t('migration_header'),

    body: (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('migrations.generic.body1')}
        </StyledText>
      </Flex>
    ),
  }
}

interface FileUploadModalContentsProps {
  uploadResponse?: FileUploadMessage | null
}
export function useFileUploadModalContents(
  props: FileUploadModalContentsProps
): ModalContents | null {
  const { uploadResponse } = props
  const { t } = useTranslation('shared')

  if (uploadResponse == null) return null

  if (uploadResponse.isError) {
    switch (uploadResponse.errorType) {
      case 'INVALID_FILE_TYPE':
        return getInvalidFileType({ t, type: 'general' })
      case 'INVALID_JSON_FILE':
        return invalidJsonModal({
          errorMessage: uploadResponse.errorMessage,
          type: 'general',
          t,
        })
      case 'INVALID_PYTHON_FILE':
        if (uploadResponse.errorMessage != null) {
          return invalidJsonModal({
            errorMessage: uploadResponse.errorMessage,
            type: 'python',
            t,
          })
        } else {
          return getInvalidFileType({ t, type: 'python' })
        }
      default: {
        console.error('Invalid error type specified for modal')
        return null
      }
    }
  }
  switch (uploadResponse.messageKey) {
    case 'DID_MIGRATE':
      return getMigrationMessage({
        t,
      })
    default: {
      console.assert(
        false,
        `invalid messageKey ${uploadResponse.messageKey} specified for modal`
      )
      return { title: '', body: uploadResponse.messageKey }
    }
  }
}
