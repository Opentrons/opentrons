import * as React from 'react'
import first from 'lodash/first'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  Icon,
  Flex,
  DIRECTION_COLUMN,
  PrimaryButton,
  DIRECTION_ROW,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { OPENTRONS_USB } from '../../redux/discovery'
import { appShellRequestor } from '../../redux/shell/remote'
import { useFeatureFlag } from '../../redux/config'
import { useTrackCreateProtocolRunEvent } from '../Devices/hooks'
import { ApplyHistoricOffsets } from '../ApplyHistoricOffsets'
import { useOffsetCandidatesForAnalysis } from '../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { ChooseRobotSlideout } from '../ChooseRobotSlideout'
import { useCreateRunFromProtocol } from './useCreateRunFromProtocol'
import type { StyleProps } from '@opentrons/components'
import type { State } from '../../redux/types'
import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { RunTimeParameter } from '@opentrons/shared-data'

const _getFileBaseName = (filePath: string): string => {
  return filePath.split('/').reverse()[0]
}
interface ChooseRobotToRunProtocolSlideoutProps extends StyleProps {
  storedProtocolData: StoredProtocolData
  onCloseClick: () => void
  showSlideout: boolean
  runTimeParameters: RunTimeParameter[]
}

export function ChooseRobotToRunProtocolSlideoutComponent(
  props: ChooseRobotToRunProtocolSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['protocol_details', 'shared', 'app_settings'])
  const { storedProtocolData, showSlideout, onCloseClick } = props
  const history = useHistory()
  const [shouldApplyOffsets, setShouldApplyOffsets] = React.useState<boolean>(
    true
  )
  const {
    protocolKey,
    srcFileNames,
    srcFiles,
    mostRecentAnalysis,
  } = storedProtocolData
  const enableRunTimeParametersFF = useFeatureFlag('enableRunTimeParameters')
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(null)
  const { trackCreateProtocolRunEvent } = useTrackCreateProtocolRunEvent(
    storedProtocolData,
    selectedRobot?.name ?? ''
  )

  // TODO: (nd: 3/20/24) remove stubs and pull parameters from analysis

  const mockRunTimeParameters: RunTimeParameter[] = [
    {
      value: false,
      displayName: 'Dry Run',
      variableName: 'DRYRUN',
      description: 'Is this a dry or wet run? Wet is true, dry is false',
      type: 'boolean',
      default: false,
    },
    {
      value: true,
      displayName: 'Use Gripper',
      variableName: 'USE_GRIPPER',
      description: 'For using the gripper.',
      type: 'boolean',
      default: true,
    },
    {
      value: true,
      displayName: 'Trash Tips',
      variableName: 'TIP_TRASH',
      description:
        'to throw tip into the trash or to not throw tip into the trash',
      type: 'boolean',
      default: true,
    },
    {
      value: true,
      displayName: 'Deactivate Temperatures',
      variableName: 'DEACTIVATE_TEMP',
      description: 'deactivate temperature on the module',
      type: 'boolean',
      default: true,
    },
    {
      value: 4,
      displayName: 'Columns of Samples',
      variableName: 'COLUMNS',
      description: 'How many columns do you want?',
      type: 'int',
      min: 1,
      max: 14,
      default: 4,
    },
    {
      value: 6,
      displayName: 'PCR Cycles',
      variableName: 'PCR_CYCLES',
      description: 'number of PCR cycles on a thermocycler',
      type: 'int',
      min: 1,
      max: 10,
      default: 6,
    },
    {
      value: 6.5,
      displayName: 'EtoH Volume',
      variableName: 'ETOH_VOLUME',
      description: '70% ethanol volume',
      type: 'float',
      suffix: 'mL',
      min: 1.5,
      max: 10.0,
      default: 6.5,
    },
    {
      value: 'none',
      displayName: 'Default Module Offsets',
      variableName: 'DEFAULT_OFFSETS',
      description: 'default module offsets for temp, H-S, and none',
      type: 'str',
      choices: [
        {
          displayName: 'No offsets',
          value: 'none',
        },
        {
          displayName: 'temp offset',
          value: '1',
        },
        {
          displayName: 'heater-shaker offset',
          value: '2',
        },
      ],
      default: 'none',
    },
    {
      value: 'left',
      displayName: 'pipette mount',
      variableName: 'mont',
      description: 'pipette mount',
      type: 'str',
      choices: [
        {
          displayName: 'Left',
          value: 'left',
        },
        {
          displayName: 'Right',
          value: 'right',
        },
      ],
      default: 'left',
    },
    {
      value: 'flex',
      displayName: 'short test case',
      variableName: 'short 2 options',
      description: 'this play 2 short options',
      type: 'str',
      choices: [
        {
          displayName: 'OT-2',
          value: 'ot2',
        },
        {
          displayName: 'Flex',
          value: 'flex',
        },
      ],
      default: 'flex',
    },
    {
      value: 'flex',
      displayName: 'long test case',
      variableName: 'long 2 options',
      description: 'this play 2 long options',
      type: 'str',
      choices: [
        {
          displayName: 'I am kind of long text version',
          value: 'ot2',
        },
        {
          displayName: 'I am kind of long text version. Today is 3/15',
          value: 'flex',
        },
      ],
      default: 'flex',
    },
  ]
  const [
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  ] = React.useState<RunTimeParameter[]>(mockRunTimeParameters)

  const offsetCandidates = useOffsetCandidatesForAnalysis(
    mostRecentAnalysis,
    selectedRobot?.ip ?? null
  )
  const {
    createRunFromProtocolSource,
    runCreationError,
    reset: resetCreateRun,
    isCreatingRun,
    runCreationErrorCode,
  } = useCreateRunFromProtocol(
    {
      onSuccess: ({ data: runData }) => {
        if (selectedRobot != null) {
          trackCreateProtocolRunEvent({
            name: 'createProtocolRecordResponse',
            properties: { success: true },
          })
          history.push(
            `/devices/${selectedRobot.name}/protocol-runs/${runData.id}`
          )
        }
      },
      onError: (error: Error) => {
        trackCreateProtocolRunEvent({
          name: 'createProtocolRecordResponse',
          properties: { success: false, error: error.message },
        })
      },
    },
    selectedRobot != null
      ? {
          hostname: selectedRobot.ip,
          requestor:
            selectedRobot?.ip === OPENTRONS_USB ? appShellRequestor : undefined,
        }
      : null,
    shouldApplyOffsets
      ? offsetCandidates.map(({ vector, location, definitionUri }) => ({
          vector,
          location,
          definitionUri,
        }))
      : []
  )
  const handleProceed: React.MouseEventHandler<HTMLButtonElement> = () => {
    trackCreateProtocolRunEvent({ name: 'createProtocolRecordRequest' })
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  const { autoUpdateAction } = useSelector((state: State) =>
    getRobotUpdateDisplayInfo(state, selectedRobot?.name ?? '')
  )

  const isSelectedRobotOnDifferentSoftwareVersion = [
    'upgrade',
    'downgrade',
  ].includes(autoUpdateAction)

  if (
    protocolKey == null ||
    srcFileNames == null ||
    srcFiles == null ||
    mostRecentAnalysis == null
  ) {
    // TODO: do more robust corrupt file catching and handling here
    return null
  }
  const srcFileObjects = srcFiles.map((srcFileBuffer, index) => {
    const srcFilePath = srcFileNames[index]
    return new File([srcFileBuffer], _getFileBaseName(srcFilePath))
  })
  const protocolDisplayName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey

  // intentionally show both robot types if analysis has any error
  const robotType =
    mostRecentAnalysis != null && mostRecentAnalysis.errors.length === 0
      ? mostRecentAnalysis?.robotType ?? null
      : null

  const SinglePageButtonWithoutFF = (
    <PrimaryButton
      disabled={
        isCreatingRun ||
        selectedRobot == null ||
        isSelectedRobotOnDifferentSoftwareVersion
      }
      width="100%"
      onClick={handleProceed}
    >
      {isCreatingRun ? (
        <Icon name="ot-spinner" spin size="1rem" />
      ) : (
        t('shared:proceed_to_setup')
      )}
    </PrimaryButton>
  )

  return (
    <ChooseRobotSlideout
      multiSlideout={{ currentPage }}
      isExpanded={showSlideout}
      isSelectedRobotOnDifferentSoftwareVersion={
        isSelectedRobotOnDifferentSoftwareVersion
      }
      onCloseClick={onCloseClick}
      title={t('choose_robot_to_run', {
        protocol_name: protocolDisplayName,
      })}
      runTimeParametersOverrides={runTimeParametersOverrides}
      setRunTimeParametersOverrides={setRunTimeParametersOverrides}
      footer={
        <Flex flexDirection={DIRECTION_COLUMN}>
          {enableRunTimeParametersFF ? (
            currentPage === 1 ? (
              <>
                <ApplyHistoricOffsets
                  offsetCandidates={offsetCandidates}
                  shouldApplyOffsets={shouldApplyOffsets}
                  setShouldApplyOffsets={setShouldApplyOffsets}
                  commands={mostRecentAnalysis?.commands ?? []}
                  labware={mostRecentAnalysis?.labware ?? []}
                  modules={mostRecentAnalysis?.modules ?? []}
                />
                <PrimaryButton
                  onClick={() => setCurrentPage(2)}
                  width="100%"
                  disabled={
                    isCreatingRun ||
                    selectedRobot == null ||
                    isSelectedRobotOnDifferentSoftwareVersion
                  }
                >
                  {t('shared:continue_to_param')}
                </PrimaryButton>
              </>
            ) : (
              <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_ROW}>
                <SecondaryButton onClick={() => setCurrentPage(1)} width="50%">
                  {t('shared:change_robot')}
                </SecondaryButton>
                <PrimaryButton width="50%" onClick={handleProceed}>
                  {isCreatingRun ? (
                    <Icon name="ot-spinner" spin size="1rem" />
                  ) : (
                    t('shared:confirm_values')
                  )}
                </PrimaryButton>
              </Flex>
            )
          ) : (
            SinglePageButtonWithoutFF
          )}
        </Flex>
      }
      selectedRobot={selectedRobot}
      setSelectedRobot={setSelectedRobot}
      robotType={robotType}
      isCreatingRun={isCreatingRun}
      reset={resetCreateRun}
      runCreationError={runCreationError}
      runCreationErrorCode={runCreationErrorCode}
      showIdleOnly={true}
    />
  )
}

export function ChooseRobotToRunProtocolSlideout(
  props: ChooseRobotToRunProtocolSlideoutProps
): JSX.Element | null {
  return <ChooseRobotToRunProtocolSlideoutComponent {...props} />
}
