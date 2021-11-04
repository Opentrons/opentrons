import * as React from 'react'
import {
  AlertItem,
  Text,
  Box,
  C_NEAR_WHITE,
  useConditionalConfirm,
} from '@opentrons/components'
import { useCreateProtocolMutation, useProtocolQuery, useCreateRunMutation, useRunQuery } from '@opentrons/react-api-client'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Page } from '../../atoms/Page'
import { UploadInput } from './UploadInput'
import { ProtocolSetup } from '../ProtocolSetup'
import { getProtocolName, getProtocolFile } from '../../redux/protocol'
import { loadProtocol, closeProtocol } from '../../redux/protocol/actions'
import { ingestProtocolFile } from '../../redux/protocol/utils'

import { ConfirmExitProtocolUploadModal } from './ConfirmExitProtocolUploadModal'

import { useLogger } from '../../logger'
import type { ErrorObject } from 'ajv'
import type { Dispatch, State } from '../../redux/types'
import { useCurrentProtocolRun } from './useCurrentProtocolRun'

const VALIDATION_ERROR_T_MAP: { [errorKey: string]: string } = {
  INVALID_FILE_TYPE: 'invalid_file_type',
  INVALID_JSON_FILE: 'invalid_json_file',
}

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const { createProtocolRun } = useCurrentProtocolRun()

  const logger = useLogger(__filename)
  const [uploadError, setUploadError] = React.useState<
    [string, ErrorObject[] | null | undefined] | null
  >(null)
  const protocolFile = useSelector((state: State) => getProtocolFile(state))
  const protocolName = useSelector((state: State) => getProtocolName(state))

  const clearError = (): void => {
    setUploadError(null)
  }

  const handleUpload = (file: File): void => {
    clearError()
    ingestProtocolFile(
      file,
      data => {
        dispatch(loadProtocol(file, data))
        createProtocolRun([file])
      },
      (errorKey, errorDetails) => {
        logger.warn(errorKey)
        console.info(errorDetails)
        setUploadError([errorKey, errorDetails?.schemaErrors])
      }
    )
  }

  const handleCloseProtocol: React.MouseEventHandler = _event => {
    dispatch(closeProtocol())
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCloseProtocol, true)

  const titleBarProps =
    protocolFile !== null
      ? {
          title: t('protocol_title', { protocol_name: protocolName }),
          back: {
            onClick: confirmExit,
            title: t('shared:close'),
            children: t('shared:close'),
            iconName: 'close' as const,
          },
        }
      : {
          title: t('upload_and_simulate'),
        }

  return (
    <>
      {showConfirmExit && (
        <ConfirmExitProtocolUploadModal exit={confirmExit} back={cancelExit} />
      )}
      <Page titleBarProps={titleBarProps}>
        {uploadError != null && (
          <AlertItem
            type="warning"
            onCloseClick={clearError}
            title={t('protocol_upload_failed')}
          >
            {t(VALIDATION_ERROR_T_MAP[uploadError[0]])}
            {uploadError[1] != null &&
              uploadError[1].map((errorObject, i) => (
                <Text key={i}>{JSON.stringify(errorObject)}</Text>
              ))}
          </AlertItem>
        )}
        <Box
          height="calc(100vh - 3rem)"
          width="100%"
          backgroundColor={C_NEAR_WHITE}
        >
          {protocolFile !== null ? (
            <ProtocolSetup />
          ) : (
            <UploadInput onUpload={handleUpload} />
          )}
        </Box>
      </Page>
    </>
  )
}
