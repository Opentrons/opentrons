import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Flex,
  Text,
  C_NEAR_WHITE,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { UploadInput } from './UploadInput'
import { openProtocol } from '../../redux/protocol/actions'

import { useLogger } from '../../logger'
import type { ErrorObject } from 'ajv'
import type { Dispatch } from '../../redux/types'

const VALIDATION_ERROR_T_MAP: {[errorKey: string]: string}= {
  INVALID_FILE_TYPE: 'invalid_file_type',
  INVALID_JSON_FILE: 'invalid_json_file'
}

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const logger = useLogger(__filename)
  const [uploadErrorKey, setUploadErrorKey] = React.useState<string | null>(null)
  const [uploadSchemaError, setUploadSchemaError] = React.useState<ErrorObject[] | null | undefined>(null)

  const clearError  = () => {
    setUploadErrorKey(null)
    setUploadSchemaError(null)
  }

  const titleBarProps = { title: t('upload_and_simulate') }

  return (
    <Page titleBarProps={titleBarProps}>
      {uploadErrorKey != null && (
        <AlertItem
          type="warning"
          onCloseClick={clearError}
          title={t('protocol_upload_failed')}
        >
          {t(VALIDATION_ERROR_T_MAP[uploadErrorKey])}
          {uploadSchemaError != null && uploadSchemaError.map(errorObject =>
            <Text>
              {JSON.stringify(errorObject)}
            </Text>)}
        </AlertItem>
      )}
      <Flex
        height="100%"
        width="100%"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <UploadInput
          createSession={ (file: File): void => { dispatch(openProtocol(file)) }}
          />
      </Flex>
    </Page>
  )
}
