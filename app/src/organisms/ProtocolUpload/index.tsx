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
  SPACING_8,
  SPACING_3,
  SPACING_2,
  NewAlertSecondaryBtn,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { Page } from '../../atoms/Page'
import { UploadInput } from './UploadInput'
import { ProtocolSetup } from '../ProtocolSetup'
import { useCurrentProtocolRun } from './hooks/useCurrentProtocolRun'
import { useCloseCurrentRun } from './hooks/useCloseCurrentRun'
import { loadProtocol } from '../../redux/protocol/actions'
import { ingestProtocolFile } from '../../redux/protocol/utils'
import { getConnectedRobotName } from '../../redux/robot/selectors'
import { getValidCustomLabwareFiles } from '../../redux/custom-labware/selectors'
import { ConfirmCancelModal } from '../RunDetails/ConfirmCancelModal'
import { useRunStatus, useRunControls } from '../RunTimeControl/hooks'

import { ConfirmExitProtocolUploadModal } from './ConfirmExitProtocolUploadModal'

import { useLogger } from '../../logger'
import type { ErrorObject } from 'ajv'
import type { Dispatch, State } from '../../redux/types'

import styles from './styles.css'

const VALIDATION_ERROR_T_MAP: { [errorKey: string]: string } = {
  INVALID_FILE_TYPE: 'invalid_file_type',
  INVALID_JSON_FILE: 'invalid_json_file',
  INVALID_PROTOCOL: 'invalid_protocol',
  ANALYSIS_ERROR: 'analysis_error',
}

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const {
    createProtocolRun,
    protocolRecord,
    isCreatingProtocolRun,
    protocolCreationError,
  } = useCurrentProtocolRun()
  const runStatus = useRunStatus()
  const { closeCurrentRun, isProtocolRunLoaded } = useCloseCurrentRun()
  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  const customLabwareFiles = useSelector((state: State) =>
    getValidCustomLabwareFiles(state)
  )

  const logger = useLogger(__filename)
  const [uploadError, setUploadError] = React.useState<
    [string, ErrorObject[] | string | null | undefined] | null
  >(null)

  const clearError = (): void => {
    setUploadError(null)
  }

  React.useEffect(() => {
    if (
      protocolRecord?.data?.analyses[0] != null &&
      'result' in protocolRecord.data.analyses[0] &&
      protocolRecord.data.analyses[0].result === 'not-ok'
    ) {
      setUploadError([
        VALIDATION_ERROR_T_MAP.ANALYSIS_ERROR,
        protocolRecord?.data.analyses[0].errors[0].detail as string,
      ])
    } else if (protocolCreationError != null) {
      setUploadError([
        VALIDATION_ERROR_T_MAP.INVALID_PROTOCOL,
        protocolCreationError,
      ])
    }
  }, [protocolRecord, protocolCreationError])

  React.useEffect(() => {
    if (uploadError != null) {
      closeCurrentRun()
    }
  }, [uploadError])

  const handleUpload = (file: File): void => {
    const protocolFiles = [file, ...customLabwareFiles]
    clearError()
    ingestProtocolFile(
      file,
      (file, data) => {
        dispatch(loadProtocol(file, data))
        createProtocolRun(protocolFiles)
      },
      (errorKey, errorDetails) => {
        logger.warn(errorKey)
        console.info(errorDetails)
        setUploadError([errorKey, errorDetails?.schemaErrors])
      }
    )
  }
  const { pause } = useRunControls()

  const handleCancelClick = (): void => {
    pause()
    setShowConfirmCancelModal(true)
  }
  const handleCloseProtocol: React.MouseEventHandler = _event => {
    closeCurrentRun()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCloseProtocol, true)
  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const isStatusFinishing = runStatus === RUN_STATUS_FINISHING

  /** NOTE: the logic to determine the contents of this titlebar is
  very close to the logic present on the RunDetails organism */
  const cancelRunButton = (
    <NewAlertSecondaryBtn
      onClick={handleCancelClick}
      marginX={SPACING_3}
      paddingX={SPACING_2}
    >
      {t('cancel_run')}
    </NewAlertSecondaryBtn>
  )
  const isRunInMotion =
    runStatus === RUN_STATUS_RUNNING ||
    runStatus === RUN_STATUS_PAUSED ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_FINISHING

  let titleBarProps
  if (isProtocolRunLoaded && !isRunInMotion) {
    titleBarProps = {
      title: t('protocol_title', {
        protocol_name: protocolRecord?.data?.metadata?.protocolName ?? '',
      }),
      back: {
        onClick: confirmExit,
        title: t('shared:close'),
        children: t('shared:close'),
        iconName: 'close' as const,
        className: styles.close_button,
      },
      className: styles.reverse_titlebar_items,
    }
  } else if (runStatus === RUN_STATUS_STOP_REQUESTED) {
    titleBarProps = {
      title: t('protocol_title', {
        protocol_name: protocolRecord?.data?.metadata?.protocolName ?? '',
      }),
    }
  } else if (isRunInMotion) {
    titleBarProps = {
      title: t('protocol_title', {
        protocol_name: protocolRecord?.data?.metadata?.protocolName ?? '',
      }),
      rightNode: cancelRunButton,
    }
  } else {
    titleBarProps = {
      title: <Text>{t('upload_and_simulate', { robot_name: robotName })}</Text>,
    }
  }

  const pageContents = isProtocolRunLoaded ? (
    <ProtocolSetup />
  ) : (
    <UploadInput onUpload={handleUpload} />
  )
  return (
    <>
      {showConfirmExit && (
        <ConfirmExitProtocolUploadModal exit={confirmExit} back={cancelExit} />
      )}
      {showConfirmCancelModal && (
        <ConfirmCancelModal onClose={() => setShowConfirmCancelModal(false)} />
      )}
      <Page titleBarProps={titleBarProps}>
        {uploadError != null && (
          <Flex
            position="absolute"
            flexDirection={DIRECTION_COLUMN}
            width="100%"
          >
            <AlertItem
              type="error"
              onCloseClick={clearError}
              title={t('protocol_upload_failed')}
            >
              {t(VALIDATION_ERROR_T_MAP[uploadError[0]])}
              {typeof uploadError[1] === 'string' ? (
                <Text>{uploadError[1]}</Text>
              ) : (
                uploadError[1] != null &&
                uploadError[1].map((errorObject, i) => (
                  <Text key={i}>{JSON.stringify(errorObject)}</Text>
                ))
              )}
            </AlertItem>
          </Flex>
        )}

        <Box
          height="calc(100vh - 3rem)"
          width="100%"
          backgroundColor={C_NEAR_WHITE}
        >
          {isCreatingProtocolRun || isStatusFinishing ? (
            <ProtocolLoader
              loadingText={
                isCreatingProtocolRun
                  ? t('protocol_loading', {
                      robot_name: robotName,
                    })
                  : t('protocol_finishing', {
                      robot_name: robotName,
                    })
              }
            />
          ) : (
            pageContents
          )}
        </Box>
      </Page>
    </>
  )
}
interface ProtocolLoaderProps {
  loadingText: string
}

function ProtocolLoader(props: ProtocolLoaderProps): JSX.Element | null {
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Text
        textAlign={ALIGN_CENTER}
        as={'h3'}
        maxWidth={SPACING_8}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        marginTop={SPACING_6}
        color={C_DARK_GRAY}
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={FONT_SIZE_BIG}
      >
        {props.loadingText}
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
