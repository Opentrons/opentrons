import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
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
import { ProtocolSetup } from '../ProtocolSetup'
import { getProtocolData, getProtocolFile } from '../../redux/protocol'
import { loadProtocol } from '../../redux/protocol/actions'
import { ingestProtocolFile } from '../../redux/protocol/utils'

import { useLogger } from '../../logger'
import type { ErrorObject } from 'ajv'
import type { Dispatch, State} from '../../redux/types'

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
  const protocolFile = useSelector((state: State) => getProtocolFile(state))

  const clearError  = () => {
    setUploadErrorKey(null)
    setUploadSchemaError(null)
  }

  const createSession = (file: File): void => {
    clearError()
    ingestProtocolFile(file, (data) => {
      dispatch(loadProtocol(file, data))
    }, (errorKey, errorDetails) => {
      setUploadErrorKey(errorKey)
      setUploadSchemaError(errorDetails?.schemaErrors)
    })
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
      { protocolFile !== null
        ? <ProtocolSetup />
        : <UploadInput createSession={createSession} />
      }
    </Page>
  )
}
