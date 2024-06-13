import * as React from 'react'
import last from 'lodash/last'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import first from 'lodash/first'
import { css } from 'styled-components'

import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_STICKY,
  SPACING,
  StyledText,
  TEXT_ALIGN_RIGHT,
  truncateString,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useInstrumentsQuery,
  useDoorQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import {
  getDeckDefFromRobotType,
  getModuleDisplayName,
  getFixtureDisplayName,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'

import {
  ProtocolSetupTitleSkeleton,
  ProtocolSetupStepSkeleton,
} from '../../organisms/OnDeviceDisplay/ProtocolSetup'
import {
  useAttachedModules,
  useLPCDisabledReason,
  useModuleCalibrationStatus,
  useProtocolAnalysisErrors,
  useRobotAnalyticsData,
  useRobotType,
  useTrackProtocolRunEvent,
} from '../../organisms/Devices/hooks'
import {
  useRequiredProtocolHardwareFromAnalysis,
  useMissingProtocolHardwareFromAnalysis,
} from '../Protocols/hooks'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupLabware } from '../../organisms/ProtocolSetupLabware'
import { ProtocolSetupModulesAndDeck } from '../../organisms/ProtocolSetupModulesAndDeck'
import { ProtocolSetupLiquids } from '../../organisms/ProtocolSetupLiquids'
import { ProtocolSetupInstruments } from '../../organisms/ProtocolSetupInstruments'
import { ProtocolSetupDeckConfiguration } from '../../organisms/ProtocolSetupDeckConfiguration'
import { useLaunchLPC } from '../../organisms/LabwarePositionCheck/useLaunchLPC'
import { getUnmatchedModulesForProtocol } from '../../organisms/ProtocolSetupModulesAndDeck/utils'
import { ConfirmCancelRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol'
import { AnalysisFailedModal } from '../../organisms/ProtocolSetupParameters/AnalysisFailedModal'
import {
  getIncompleteInstrumentCount,
  getProtocolUsesGripper,
} from '../../organisms/ProtocolSetupInstruments/utils'
import {
  useRunControls,
  useRunStatus,
} from '../../organisms/RunTimeControl/hooks'
import { useToaster } from '../../organisms/ToasterOven'
import { useIsHeaterShakerInProtocol } from '../../organisms/ModuleCard/hooks'
import { getLabwareSetupItemGroups } from '../Protocols/utils'
import { getLocalRobot, getRobotSerialNumber } from '../../redux/discovery'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '../../redux/analytics'
import { getIsHeaterShakerAttached } from '../../redux/config'
import { ConfirmAttachedModal } from './ConfirmAttachedModal'
import { getLatestCurrentOffsets } from '../../organisms/Devices/ProtocolRun/SetupLabwarePositionCheck/utils'
import { CloseButton, PlayButton } from './Buttons'
import { useDeckConfigurationCompatibility } from '../../resources/deck_configuration/hooks'
import { getRequiredDeckConfig } from '../../resources/deck_configuration/utils'
import { useNotifyRunQuery } from '../../resources/runs'
import { ViewOnlyParameters } from '../../organisms/ProtocolSetupParameters/ViewOnlyParameters'

import type { Run } from '@opentrons/api-client'
import type { CutoutFixtureId, CutoutId } from '@opentrons/shared-data'
import type { OnDeviceRouteParams } from '../../App/types'
import type {
  ProtocolHardware,
  ProtocolFixture,
} from '../../pages/Protocols/hooks'
import type { ProtocolModuleInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'

const FETCH_DURATION_MS = 5000
interface ProtocolSetupStepProps {
  onClickSetupStep: () => void
  status: 'ready' | 'not ready' | 'general' | 'inform'
  title: string
  // first line of detail text
  detail?: string | null
  // second line of detail text
  subDetail?: string | null
  // disallow click handler, disabled styling
  disabled?: boolean
  // display the reason the setup step is disabled
  disabledReason?: string | null
  //  optional description
  description?: string | null
  //  optional removal of the left icon
  hasLeftIcon?: boolean
  //  optional removal of the right icon
  hasRightIcon?: boolean
  //  optional enlarge the font size
  fontSize?: string
}

export function ProtocolSetupStep({
  onClickSetupStep,
  status,
  title,
  detail,
  subDetail,
  disabled = false,
  disabledReason,
  description,
  hasRightIcon = true,
  hasLeftIcon = true,
  fontSize = 'p',
}: ProtocolSetupStepProps): JSX.Element {
  const backgroundColorByStepStatus = {
    ready: COLORS.green35,
    'not ready': COLORS.yellow35,
    general: COLORS.grey35,
    inform: COLORS.grey35,
  }
  const { makeSnackbar } = useToaster()

  const makeDisabledReasonSnackbar = (): void => {
    if (disabledReason != null) {
      makeSnackbar(disabledReason)
    }
  }

  let backgroundColor: string
  if (!disabled) {
    switch (status) {
      case 'general':
        backgroundColor = COLORS.blue35
        break
      case 'ready':
        backgroundColor = COLORS.green40
        break
      case 'inform':
        backgroundColor = COLORS.grey50
        break
      default:
        backgroundColor = COLORS.yellow40
    }
  } else backgroundColor = ''

  const PUSHED_STATE_STYLE = css`
    &:active {
      background-color: ${backgroundColor};
    }
  `

  const isToggle = detail === 'On' || detail === 'Off'

  return (
    <Btn
      onClick={() => {
        !disabled ? onClickSetupStep() : makeDisabledReasonSnackbar()
      }}
      width="100%"
    >
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={
          disabled ? COLORS.grey35 : backgroundColorByStepStatus[status]
        }
        borderRadius={BORDERS.borderRadius16}
        gridGap={SPACING.spacing16}
        padding={`${SPACING.spacing20} ${SPACING.spacing24}`}
        css={PUSHED_STATE_STYLE}
      >
        {status !== 'general' &&
        !disabled &&
        status !== 'inform' &&
        !disabled &&
        hasLeftIcon ? (
          <Icon
            color={status === 'ready' ? COLORS.green50 : COLORS.yellow50}
            size="2rem"
            name={status === 'ready' ? 'ot-check' : 'ot-alert'}
          />
        ) : null}
        <Flex
          flexDirection={DIRECTION_COLUMN}
          textAlign={TYPOGRAPHY.textAlignLeft}
        >
          <StyledText
            as="h4"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={disabled ? COLORS.grey50 : COLORS.black90}
          >
            {title}
          </StyledText>
          {description != null ? (
            <StyledText
              as="h4"
              color={disabled ? COLORS.grey50 : COLORS.grey60}
              maxWidth="35rem"
            >
              {description}
            </StyledText>
          ) : null}
        </Flex>
        <Flex
          flex="1"
          justifyContent={JUSTIFY_END}
          padding={
            isToggle ? `${SPACING.spacing12} ${SPACING.spacing10}` : 'undefined'
          }
        >
          <StyledText
            as={fontSize}
            textAlign={TEXT_ALIGN_RIGHT}
            color={disabled ? COLORS.grey50 : COLORS.black90}
            maxWidth="20rem"
          >
            {detail}
            {subDetail != null && detail != null ? <br /> : null}
            {subDetail}
          </StyledText>
        </Flex>
        {disabled || !hasRightIcon ? null : (
          <Icon
            marginLeft={SPACING.spacing8}
            name="more"
            size="3rem"
            // Required to prevent inconsistent component height.
            style={{ backgroundColor: 'initial' }}
          />
        )}
      </Flex>
    </Btn>
  )
}

const ANALYSIS_POLL_MS = 5000
interface PrepareToRunProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  confirmAttachment: () => void
  play: () => void
  robotName: string
  runRecord: Run | null
}

function PrepareToRun({
  runId,
  setSetupScreen,
  confirmAttachment,
  play,
  robotName,
  runRecord,
}: PrepareToRunProps): JSX.Element {
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])
  const history = useHistory()
  const { makeSnackbar } = useToaster()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false)
  const observer = new IntersectionObserver(([entry]) => {
    setIsScrolled(!entry.isIntersecting)
  })
  if (scrollRef.current != null) {
    observer.observe(scrollRef.current)
  }

  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const { data: attachedInstruments } = useInstrumentsQuery()
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name ??
    ''

  const mostRecentAnalysisSummary = last(protocolRecord?.data.analysisSummaries)
  const [
    isPollingForCompletedAnalysis,
    setIsPollingForCompletedAnalysis,
  ] = React.useState<boolean>(mostRecentAnalysisSummary?.status !== 'completed')

  const {
    data: mostRecentAnalysis = null,
  } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolRecord?.data.analysisSummaries)?.id ?? null,
    {
      enabled: protocolRecord != null && isPollingForCompletedAnalysis,
      refetchInterval: ANALYSIS_POLL_MS,
    }
  )

  const runStatus = useRunStatus(runId)
  if (runStatus === RUN_STATUS_STOPPED) {
    history.push('/protocols')
  }

  React.useEffect(() => {
    if (mostRecentAnalysis?.status === 'completed') {
      setIsPollingForCompletedAnalysis(false)
    } else {
      setIsPollingForCompletedAnalysis(true)
    }
  }, [mostRecentAnalysis?.status])

  const robotType = useRobotType(robotName)
  const { launchLPC, LPCWizard } = useLaunchLPC(runId, robotType, protocolName)

  const onConfirmCancelClose = (): void => {
    setShowConfirmCancelModal(false)
    history.goBack()
  }

  const protocolHasModules =
    mostRecentAnalysis?.modules != null &&
    mostRecentAnalysis?.modules.length > 0
  const attachedModules =
    useAttachedModules({
      refetchInterval: FETCH_DURATION_MS,
    }) ?? []

  const { requiredProtocolHardware } = useRequiredProtocolHardwareFromAnalysis(
    mostRecentAnalysis
  )

  const requiredFixtures = requiredProtocolHardware.filter(
    (hardware): hardware is ProtocolFixture => {
      return hardware.hardwareType === 'fixture'
    }
  )

  const protocolHasFixtures = requiredFixtures.length > 0

  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()

  const deckDef = getDeckDefFromRobotType(robotType)

  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const { missingModuleIds } = getUnmatchedModulesForProtocol(
    attachedModules,
    protocolModulesInfo
  )
  const incompleteInstrumentCount: number | null =
    mostRecentAnalysis != null && attachedInstruments != null
      ? getIncompleteInstrumentCount(mostRecentAnalysis, attachedInstruments)
      : null

  const isMissingModules = missingModuleIds.length > 0
  const lpcDisabledReason = useLPCDisabledReason({
    runId,
    hasMissingModulesForOdd: isMissingModules,
    hasMissingCalForOdd:
      incompleteInstrumentCount != null && incompleteInstrumentCount > 0,
  })
  const moduleCalibrationStatus = useModuleCalibrationStatus(robotName, runId)

  const runTimeParameters = mostRecentAnalysis?.runTimeParameters ?? []
  const hasRunTimeParameters = runTimeParameters.length > 0
  const hasCustomRunTimeParameters = runTimeParameters.some(
    parameter =>
      parameter.type === 'csv_file' || parameter.value !== parameter.default
  )

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    mostRecentAnalysis
  )

  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

  const requiredDeckConfigCompatibility = getRequiredDeckConfig(
    deckConfigCompatibility
  )

  // True if any server request is still pending.
  const isLoading =
    mostRecentAnalysis == null ||
    attachedInstruments == null ||
    (protocolHasModules && attachedModules == null)

  const speccedInstrumentCount =
    mostRecentAnalysis !== null
      ? mostRecentAnalysis.pipettes.length +
        (getProtocolUsesGripper(mostRecentAnalysis) ? 1 : 0)
      : 0

  const { missingProtocolHardware } = useMissingProtocolHardwareFromAnalysis(
    robotType,
    mostRecentAnalysis
  )

  const locationConflictSlots = requiredDeckConfigCompatibility.map(
    fixtureCompatibility => {
      const {
        compatibleCutoutFixtureIds,
        cutoutFixtureId,
      } = fixtureCompatibility
      const isCurrentFixtureCompatible =
        cutoutFixtureId != null &&
        compatibleCutoutFixtureIds.includes(cutoutFixtureId)
      return (
        !isCurrentFixtureCompatible &&
        cutoutFixtureId != null &&
        !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
      )
    }
  )
  const isLocationConflict = locationConflictSlots.some(
    conflictSlot => conflictSlot
  )

  const missingPipettes = missingProtocolHardware.filter(
    hardware => hardware.hardwareType === 'pipette'
  )

  const missingGripper = missingProtocolHardware.filter(
    hardware => hardware.hardwareType === 'gripper'
  )

  const missingModules = missingProtocolHardware.filter(
    hardware => hardware.hardwareType === 'module'
  )
  const missingFixtures = missingProtocolHardware.filter(
    (hardware): hardware is ProtocolFixture =>
      hardware.hardwareType === 'fixture'
  )

  let instrumentsDetail
  if (missingPipettes.length > 0 && missingGripper.length > 0) {
    instrumentsDetail = t('missing_instruments', {
      count: missingPipettes.length + missingGripper.length,
    })
  } else if (missingPipettes.length > 0) {
    instrumentsDetail = t('missing_pipettes', { count: missingPipettes.length })
  } else if (missingGripper.length > 0) {
    instrumentsDetail = t('missing_gripper')
  } else if (incompleteInstrumentCount === 0) {
    instrumentsDetail = t('instruments_connected', {
      count: speccedInstrumentCount,
    })
  } else if (
    incompleteInstrumentCount != null &&
    incompleteInstrumentCount > 0
  ) {
    instrumentsDetail = t('instrument_calibrations_missing', {
      count: incompleteInstrumentCount,
    })
  } else {
    instrumentsDetail = null
  }

  const instrumentsStatus =
    incompleteInstrumentCount === 0 ? 'ready' : 'not ready'

  const areModulesReady = !isMissingModules && moduleCalibrationStatus.complete

  const isMissingFixtures = missingFixtures.length > 0

  const areFixturesReady = !isMissingFixtures

  const modulesStatus =
    areModulesReady && areFixturesReady && !isLocationConflict
      ? 'ready'
      : 'not ready'

  const isReadyToRun =
    incompleteInstrumentCount === 0 && areModulesReady && areFixturesReady
  const onPlay = (): void => {
    if (isDoorOpen) {
      makeSnackbar(t('shared:close_robot_door'))
    } else {
      if (
        isHeaterShakerInProtocol &&
        isReadyToRun &&
        runStatus === RUN_STATUS_IDLE
      ) {
        confirmAttachment()
      } else {
        if (isReadyToRun) {
          play()
          trackProtocolRunEvent({
            name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
            properties: robotAnalyticsData != null ? robotAnalyticsData : {},
          })
        } else {
          makeSnackbar(
            i18n.format(t('complete_setup_before_proceeding'), 'capitalize')
          )
        }
      }
    }
  }

  // get display name of first missing module
  const firstMissingModuleId = first(missingModuleIds)
  const firstMissingModuleModel = mostRecentAnalysis?.modules.find(
    module => module.id === firstMissingModuleId
  )?.model
  const firstMissingModuleDisplayName: string =
    firstMissingModuleModel != null
      ? getModuleDisplayName(firstMissingModuleModel)
      : ''

  const getConnectedHardwareText = (
    protocolModulesInfo: ProtocolModuleInfo[],
    requiredFixtures: ProtocolHardware[]
  ): {
    detail: string
    subdetail?: string
  } => {
    if (protocolModulesInfo.length === 0 && requiredFixtures.length === 0) {
      return { detail: t('no_modules_used_in_this_protocol') }
    } else if (
      protocolModulesInfo.length > 0 &&
      requiredFixtures.length === 0
    ) {
      // protocol only uses modules
      return {
        detail: t('modules_connected', {
          count: protocolModulesInfo.length,
        }),
      }
    } else if (
      protocolModulesInfo.length === 0 &&
      requiredFixtures.length > 0
    ) {
      // protocol only uses fixtures
      return {
        detail: t('fixtures_connected', {
          count: requiredFixtures.length,
        }),
      }
    } else {
      // protocol uses fixtures and modules
      return {
        detail: t('fixtures_connected', {
          count: requiredFixtures.length,
        }),
        subdetail: t('modules_connected', {
          count: protocolModulesInfo.length,
        }),
      }
    }
  }

  const missingModulesText =
    missingModuleIds.length === 1
      ? `${t('missing')} ${firstMissingModuleDisplayName}`
      : t('multiple_modules_missing', { count: missingModuleIds.length })

  const missingFixturesText =
    missingFixtures.length === 1
      ? `${t('missing')} ${getFixtureDisplayName(
          missingFixtures[0].cutoutFixtureId
        )}`
      : t('multiple_fixtures_missing', { count: missingFixtures.length })

  const missingMultipleHardwareTypes =
    [missingModules, missingFixtures].filter(
      missingHardwareArr => missingHardwareArr.length > 0
    ).length > 1

  let modulesDetail: string
  let modulesSubDetail: string | null = null
  if (isLocationConflict) {
    modulesDetail = t('location_conflict')
  } else if (missingMultipleHardwareTypes) {
    modulesDetail = t('hardware_missing')
  } else if (missingFixtures.length > 0) {
    modulesDetail = missingFixturesText
  } else if (isMissingModules) {
    modulesDetail = missingModulesText
  } else if (!moduleCalibrationStatus.complete) {
    modulesDetail = t('calibration_required')
  } else {
    // modules and deck are ready
    const hardwareDetail = getConnectedHardwareText(
      protocolModulesInfo,
      requiredFixtures
    )
    modulesDetail = hardwareDetail.detail
    modulesSubDetail = hardwareDetail?.subdetail ?? null
  }

  // Labware information
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(
    mostRecentAnalysis?.commands ?? []
  )
  const onDeckLabwareCount = onDeckItems.length
  const additionalLabwareCount = offDeckItems.length

  const labwareDetail =
    onDeckLabwareCount > 0
      ? t('on-deck_labware', { count: onDeckLabwareCount })
      : null
  const labwareSubDetail =
    additionalLabwareCount > 0
      ? t('additional_labware', { count: additionalLabwareCount })
      : null

  const latestCurrentOffsets = getLatestCurrentOffsets(
    runRecord?.data?.labwareOffsets ?? []
  )

  // Liquids information
  const liquidsInProtocol = mostRecentAnalysis?.liquids ?? []

  const { data: doorStatus } = useDoorQuery({
    refetchInterval: FETCH_DURATION_MS,
  })
  const isDoorOpen =
    doorStatus?.data.status === 'open' &&
    doorStatus?.data.doorRequiredClosedForProtocol

  const parametersDetail = hasRunTimeParameters
    ? hasCustomRunTimeParameters
      ? t('custom_values')
      : t('default_values')
    : t('no_parameters_specified')

  return (
    <>
      {/* Empty box to detect scrolling */}
      <Flex ref={scrollRef} />
      {/* Protocol Setup Header */}
      <Flex
        boxShadow={isScrolled ? BORDERS.shadowBig : undefined}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
        position={POSITION_STICKY}
        top={0}
        backgroundColor={COLORS.white}
        overflowY="auto"
        marginX={`-${SPACING.spacing32}`}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing2}
            maxWidth="43rem"
          >
            {!isLoading ? (
              <>
                <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
                  {t('prepare_to_run')}
                </StyledText>
                <StyledText
                  as="h4"
                  color={COLORS.grey50}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  overflowWrap={OVERFLOW_WRAP_ANYWHERE}
                >
                  {truncateString(protocolName, 100)}
                </StyledText>
              </>
            ) : (
              <ProtocolSetupTitleSkeleton />
            )}
          </Flex>
          <Flex gridGap={SPACING.spacing16}>
            <CloseButton
              onClose={
                !isLoading
                  ? () => {
                      setShowConfirmCancelModal(true)
                    }
                  : onConfirmCancelClose
              }
            />
            <PlayButton
              disabled={isLoading}
              onPlay={!isLoading ? onPlay : undefined}
              ready={!isLoading ? isReadyToRun : false}
              isDoorOpen={isDoorOpen}
            />
          </Flex>
        </Flex>
      </Flex>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing8}
      >
        {!isLoading ? (
          <>
            <ProtocolSetupStep
              onClickSetupStep={() => {
                setSetupScreen('instruments')
              }}
              title={t('instruments')}
              detail={instrumentsDetail}
              status={instrumentsStatus}
              disabled={speccedInstrumentCount === 0}
            />
            <ProtocolSetupStep
              onClickSetupStep={() => {
                setSetupScreen('modules')
              }}
              title={t('deck_hardware')}
              detail={modulesDetail}
              subDetail={modulesSubDetail}
              status={modulesStatus}
              disabled={
                protocolModulesInfo.length === 0 && !protocolHasFixtures
              }
            />
            <ProtocolSetupStep
              onClickSetupStep={() => {
                launchLPC()
              }}
              title={t('labware_position_check')}
              detail={t(
                lpcDisabledReason != null
                  ? 'currently_unavailable'
                  : 'recommended'
              )}
              subDetail={
                latestCurrentOffsets.length > 0
                  ? t('offsets_applied', { count: latestCurrentOffsets.length })
                  : null
              }
              status="general"
              disabled={lpcDisabledReason != null}
              disabledReason={lpcDisabledReason}
            />
            <ProtocolSetupStep
              onClickSetupStep={() => {
                setSetupScreen('view only parameters')
              }}
              title={t('parameters')}
              detail={parametersDetail}
              subDetail={null}
              status="general"
              disabled={!hasRunTimeParameters}
            />
            <ProtocolSetupStep
              onClickSetupStep={() => {
                setSetupScreen('labware')
              }}
              title={t('labware')}
              detail={labwareDetail}
              subDetail={labwareSubDetail}
              status="general"
              disabled={labwareDetail == null}
            />
            <ProtocolSetupStep
              onClickSetupStep={() => {
                setSetupScreen('liquids')
              }}
              title={t('liquids')}
              status="general"
              detail={
                liquidsInProtocol.length > 0
                  ? t('initial_liquids_num', {
                      count: liquidsInProtocol.length,
                    })
                  : t('liquids_not_in_setup')
              }
              disabled={liquidsInProtocol.length === 0}
            />
          </>
        ) : (
          <ProtocolSetupStepSkeleton />
        )}
      </Flex>
      {LPCWizard}
      {showConfirmCancelModal ? (
        <ConfirmCancelRunModal
          runId={runId}
          setShowConfirmCancelRunModal={setShowConfirmCancelModal}
          isActiveRun={false}
          protocolId={protocolId}
        />
      ) : null}
    </>
  )
}

export type SetupScreens =
  | 'prepare to run'
  | 'instruments'
  | 'modules'
  | 'labware'
  | 'liquids'
  | 'deck configuration'
  | 'view only parameters'

export function ProtocolSetup(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const localRobot = useSelector(getLocalRobot)
  const robotSerialNumber =
    localRobot?.status != null ? getRobotSerialNumber(localRobot) : null
  const trackEvent = useTrackEvent()
  const { play } = useRunControls(runId)
  const [
    showAnalysisFailedModal,
    setShowAnalysisFailedModal,
  ] = React.useState<boolean>(true)

  const handleProceedToRunClick = (): void => {
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { robotSerialNumber },
    })
    play()
  }
  const configBypassHeaterShakerAttachmentConfirmation = useSelector(
    getIsHeaterShakerAttached
  )
  const {
    confirm: confirmAttachment,
    showConfirmation: showConfirmationModal,
    cancel: cancelExit,
  } = useConditionalConfirm(
    handleProceedToRunClick,
    !configBypassHeaterShakerAttachmentConfirmation
  )
  const [cutoutId, setCutoutId] = React.useState<CutoutId | null>(null)
  const [providedFixtureOptions, setProvidedFixtureOptions] = React.useState<
    CutoutFixtureId[]
  >([])

  // orchestrate setup subpages/components
  const [setupScreen, setSetupScreen] = React.useState<SetupScreens>(
    'prepare to run'
  )
  const setupComponentByScreen = {
    'prepare to run': (
      <PrepareToRun
        runId={runId}
        setSetupScreen={setSetupScreen}
        confirmAttachment={confirmAttachment}
        play={play}
        robotName={localRobot?.name != null ? localRobot.name : 'no name'}
        runRecord={runRecord ?? null}
      />
    ),
    instruments: (
      <ProtocolSetupInstruments runId={runId} setSetupScreen={setSetupScreen} />
    ),
    modules: (
      <ProtocolSetupModulesAndDeck
        runId={runId}
        setSetupScreen={setSetupScreen}
        setCutoutId={setCutoutId}
        setProvidedFixtureOptions={setProvidedFixtureOptions}
      />
    ),
    labware: (
      <ProtocolSetupLabware runId={runId} setSetupScreen={setSetupScreen} />
    ),
    liquids: (
      <ProtocolSetupLiquids runId={runId} setSetupScreen={setSetupScreen} />
    ),
    'deck configuration': (
      <ProtocolSetupDeckConfiguration
        cutoutId={cutoutId}
        runId={runId}
        setSetupScreen={setSetupScreen}
        providedFixtureOptions={providedFixtureOptions}
      />
    ),
    'view only parameters': (
      <ViewOnlyParameters runId={runId} setSetupScreen={setSetupScreen} />
    ),
  }

  return (
    <>
      {showAnalysisFailedModal &&
      analysisErrors != null &&
      analysisErrors?.length > 0 ? (
        <AnalysisFailedModal
          setShowAnalysisFailedModal={setShowAnalysisFailedModal}
          protocolId={runRecord?.data.protocolId ?? null}
          errors={analysisErrors.map(error => error.detail)}
        />
      ) : null}
      {showConfirmationModal ? (
        <ConfirmAttachedModal
          onCloseClick={cancelExit}
          isProceedToRunModal={true}
          onConfirmClick={handleProceedToRunClick}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={
          setupScreen === 'prepare to run'
            ? `0 ${SPACING.spacing32} ${SPACING.spacing40}`
            : `${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`
        }
      >
        {setupComponentByScreen[setupScreen]}
      </Flex>
    </>
  )
}
