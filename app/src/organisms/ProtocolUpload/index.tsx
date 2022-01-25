import * as React from 'react'
import styled from 'styled-components'
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
  FONT_SIZE_CAPTION,
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
import { getLabwareDefinitionUri } from '../ProtocolSetup/utils/getLabwareDefinitionUri'
import styles from './styles.css'
import type { ProtocolFile, RunTimeCommand } from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'
import { useProtocolDetails } from '../RunDetails/hooks'

const VALIDATION_ERROR_T_MAP: { [errorKey: string]: string } = {
  INVALID_FILE_TYPE: 'invalid_file_type',
  INVALID_JSON_FILE: 'invalid_json_file',
  INVALID_PROTOCOL: 'invalid_protocol',
  ANALYSIS_ERROR: 'analysis_error',
}

const JsonTextArea = styled.textarea`
  min-height: 30vh;
  width: 100%;
  font-size: ${FONT_SIZE_CAPTION};
  font-family: monospace;
`

const PYTHON_INDENT = '    '
const JUPYTER_PREFIX =
  'import opentrons.execute\nprotocol = opentrons.execute.get_protocol_api("2.12")\n\n'
const CLI_PREFIX =
  `from opentrons import protocol_api\n\nmetadata = {\n${PYTHON_INDENT}"apiLevel": "2.12"\n}\n\ndef run(protocol: protocol_api.ProtocolContext):`
function createSnippet(
  mode: 'jupyter' | 'cli',
  protocol: ProtocolFile<{}> | null,
  run: RunData | null
): string | null {
  if (protocol == null || run == null) return null
  const { labwareOffsets } = run
  let moduleVariableById: { [moduleId: string]: string } = {}
  const loadCommandLines = protocol.commands.reduce<string[]>(
    (acc, command, index) => {
      let loadStatement = ''
      let addendum = null
      if (command.commandType === 'loadLabware') {
        const loadedLabware = protocol.labware[command.result.labwareId]
        if (loadedLabware == null) return acc
        const { loadName } = protocol.labwareDefinitions[
          loadedLabware.definitionId
        ].parameters
        if ('slotName' in command.params.location) {
          // load labware on deck
          const { slotName } = command.params.location
          loadStatement = `labware_${index} = protocol.load_labware("${loadName}", location="${slotName}")`
        } else if ('moduleId' in command.params.location) {
          // load labware on module
          const moduleVariable =
            moduleVariableById[command.params.location.moduleId]
          loadStatement = `labware_${index} = ${moduleVariable}.load_labware("${loadName}")`
        }
        const labwareDefUri = getLabwareDefinitionUri(
          command.result.labwareId,
          protocol.labware
        )
        const labwareOffset = labwareOffsets?.find(
          offset => offset.definitionUri === labwareDefUri
        )
        if (labwareOffset == null) {
          addendum = [loadStatement, '']
        } else {
          const { x, y, z } = labwareOffset.vector
          addendum = [
            loadStatement,
            `labware_${index}.set_offset(x=${x}, y=${y}, z=${z})`,
            '',
          ]
        }
      } else if (command.commandType === 'loadModule') {
        // load module on deck
        const moduleVariable = `module_${index}`
        moduleVariableById = {
          ...moduleVariableById,
          [command.result.moduleId]: moduleVariable,
        }
        const { model } = protocol.modules[command.params.moduleId]
        const { slotName } = command.params.location
        addendum = [
          `${moduleVariable} = protocol.load_module("${model}", location="${slotName}")`,
          '',
        ]
      }

      return addendum != null ? [...acc, ...addendum] : acc
    },
    []
  )
  return loadCommandLines.reduce<string>((acc, line) => {
    if (mode === 'jupyter') {
      return `${acc}\n${line}`
    } else {
      return `${acc}\n${PYTHON_INDENT}${line}`
    }
  }, `${mode === 'jupyter' ? JUPYTER_PREFIX : CLI_PREFIX}`)
}

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const {
    createProtocolRun,
    runRecord,
    protocolRecord,
    isCreatingProtocolRun,
    protocolCreationError,
  } = useCurrentProtocolRun()
  const { protocolData } = useProtocolDetails()
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

  const protocolName = protocolRecord?.data?.metadata?.protocolName ?? ''

  let titleBarProps
  if (
    isProtocolRunLoaded &&
    !isRunInMotion &&
    runStatus !== RUN_STATUS_STOP_REQUESTED
  ) {
    titleBarProps = {
      title: t('protocol_title', {
        protocol_name: protocolName,
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
        protocol_name: protocolName,
      }),
    }
  } else if (isRunInMotion) {
    titleBarProps = {
      title: t('protocol_title', {
        protocol_name: protocolName,
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

  const pageDisplay =
    isCreatingProtocolRun || isStatusFinishing ? (
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
        <Flex>
          <JsonTextArea
            value={createSnippet(
              'jupyter',
              protocolData,
              runRecord?.data ?? null
            )}
          />
          <JsonTextArea
            value={createSnippet('cli', protocolData, runRecord?.data ?? null)}
          />
        </Flex>
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
          {pageDisplay}
        </Box>
      </Page>
    </>
  )
}
interface ProtocolLoaderProps {
  loadingText: string
}

export function ProtocolLoader(props: ProtocolLoaderProps): JSX.Element | null {
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
