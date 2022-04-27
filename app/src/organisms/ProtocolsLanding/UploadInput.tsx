import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  Link,
  COLORS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { UploadInput as FileImporter } from '../../molecules/UploadInput'
import { addProtocol } from '../../redux/protocol-storage'
import type { Dispatch } from '../../redux/types'
import { useLogger } from '../../logger'

export interface UploadInputProps {
  onUpload?: () => void
}

// TODO(bc, 2022-3-21): consider making this generic for any file upload and adding it to molecules/organisms with onUpload taking the files from the event
export function UploadInput(props: UploadInputProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const logger = useLogger(__filename)

  const handleUpload = (file: File): void => {
    if (file.path === null) {
      logger.warn('Failed to upload file, path not found')
    }
    dispatch(addProtocol(file.path))
    props.onUpload?.()
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      <FileImporter
        onUpload={(file: File) => handleUpload(file)}
        uploadText={t('valid_file_types')}
        dragAndDropText={
          <StyledText as="p">
            <Trans
              t={t}
              i18nKey="shared:drag_and_drop"
              components={{
                a: <Link color={COLORS.blue} role="button" />,
              }}
            />
          </StyledText>
        }
      />
    </Flex>
  )
}
