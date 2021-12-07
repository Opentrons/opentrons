import * as React from 'react'
import {
  AlertItem,
  Text,
  Box,
  Icon,
  Flex,
  C_NEAR_WHITE,
  useConditionalConfirm,
  SPACING_5,
  JUSTIFY_CENTER,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  FONT_WEIGHT_REGULAR,
  C_DARK_GRAY,
  SPACING_6,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_SIZE_BIG,
  SPACING_7,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Page } from '../../atoms/Page'
import { UploadInput } from './UploadInput'
import { ProtocolSetup } from '../ProtocolSetup'
import { useCurrentProtocolRun } from './hooks/useCurrentProtocolRun'
import { useCloseCurrentRun } from './hooks/useCloseCurrentRun'
import { loadProtocol } from '../../redux/protocol/actions'
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
    isCreatingProtocolRun,
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

  const pageContents =
    !isClosingCurrentRun && hasCurrentRun ? (
      <ProtocolSetup />
    ) : (
      <UploadInput onUpload={handleUpload} />
    )

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
          {isCreatingProtocolRun ? <ProtocolLoader /> : pageContents}
        </Box>
      </Page>
    </>
  )
}

function ProtocolLoader(): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Text
        textAlign={ALIGN_CENTER}
        as={'h3'}
        maxWidth={SPACING_7}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        marginTop={SPACING_6}
        color={C_DARK_GRAY}
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={FONT_SIZE_BIG}
      >
        {t('protocol_loading', {
          robot_name: robotName,
        })}
      </Text>
      <Icon
        name="ot-spinner"
        width={SPACING_5}
        marginTop={SPACING_5}
        color={C_DARK_GRAY}
        spin
      />
    </Flex>
  )
}
