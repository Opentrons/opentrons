import * as React from 'react'
import {
  AlertItem,
  Text,
  Box,
  C_NEAR_WHITE,
  useConditionalConfirm,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Page } from '../../atoms/Page'
import { UploadInput } from './UploadInput'
import { ProtocolSetup } from '../ProtocolSetup'
import { useCurrentProtocolRun } from './hooks/useCurrentProtocolRun'
import { useCloseCurrentRun } from './hooks/useCloseCurrentRun'
import { loadProtocol, closeProtocol } from '../../redux/protocol/actions'
import { ingestProtocolFile } from '../../redux/protocol/utils'
import { getConnectedRobotName } from '../../redux/robot/selectors'

import { ConfirmExitProtocolUploadModal } from './ConfirmExitProtocolUploadModal'

import { useLogger } from '../../logger'
import type { ErrorObject } from 'ajv'
import type { Dispatch, State } from '../../redux/types'

import styles from './styles.css'

const VALIDATION_ERROR_T_MAP: { [errorKey: string]: string } = {
  INVALID_FILE_TYPE: 'invalid_file_type',
  INVALID_JSON_FILE: 'invalid_json_file',
}

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const {
    createProtocolRun,
    runRecord,
    protocolRecord,
  } = useCurrentProtocolRun()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const hasCurrentRun = runRecord != null && protocolRecord != null
  const robotName = useSelector((state: State) => getConnectedRobotName(state))

  const logger = useLogger(__filename)
  const [uploadError, setUploadError] = React.useState<
    [string, ErrorObject[] | null | undefined] | null
  >(null)

  const clearError = (): void => {
    setUploadError(null)
  }

  const handleUpload = (file: File): void => {
    clearError()
    ingestProtocolFile(
      file,
      (file, data) => {
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
    closeCurrentRun()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCloseProtocol, true)

  const titleBarProps =
    !isClosingCurrentRun && hasCurrentRun
      ? {
          title: t('protocol_title', {
            protocol_name: protocolRecord?.data?.metadata?.protocolName ?? '',
          }),
          back: {
            onClick: confirmExit,
            title: t('shared:close'),
            children: t('shared:close'),
            iconName: 'close' as const,
          },
          className: styles.reverse_titlebar_items,
        }
      : {
          title: (
            <Text>{t('upload_and_simulate', { robot_name: robotName })}</Text>
          ),
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
          {!isClosingCurrentRun && hasCurrentRun ? (
            <ProtocolSetup />
          ) : (
            <UploadInput onUpload={handleUpload} />
          )}
        </Box>
      </Page>
    </>
  )
}
