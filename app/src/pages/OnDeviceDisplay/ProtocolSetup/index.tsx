import * as React from 'react'
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
  POSITION_STICKY,
  SPACING,
  TEXT_ALIGN_RIGHT,
  truncateString,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunQuery,
  useInstrumentsQuery,
  useDoorQuery,
} from '@opentrons/react-api-client'
import {
  getDeckDefFromRobotType,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import {
  ProtocolSetupTitleSkeleton,
  ProtocolSetupStepSkeleton,
} from '../../../organisms/OnDeviceDisplay/ProtocolSetup'
import {
  useAttachedModules,
  useLPCDisabledReason,
} from '../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getProtocolModulesInfo } from '../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupLabware } from '../../../organisms/ProtocolSetupLabware'
import { ProtocolSetupModulesAndDeck } from '../../../organisms/ProtocolSetupModulesAndDeck'
import { ProtocolSetupLiquids } from '../../../organisms/ProtocolSetupLiquids'
import { ProtocolSetupInstruments } from '../../../organisms/ProtocolSetupInstruments'
import { ProtocolSetupDeckConfiguration } from '../../../organisms/ProtocolSetupDeckConfiguration'
import { useLaunchLPC } from '../../../organisms/LabwarePositionCheck/useLaunchLPC'
import { getUnmatchedModulesForProtocol } from '../../../organisms/ProtocolSetupModulesAndDeck/utils'
import { ConfirmCancelRunModal } from '../../../organisms/OnDeviceDisplay/RunningProtocol'
import {
  getAreInstrumentsReady,
  getProtocolUsesGripper,
} from '../../../organisms/ProtocolSetupInstruments/utils'
import {
  useRunControls,
  useRunStatus,
} from '../../../organisms/RunTimeControl/hooks'
import { useToaster } from '../../../organisms/ToasterOven'
import { useIsHeaterShakerInProtocol } from '../../../organisms/ModuleCard/hooks'
import { getLabwareSetupItemGroups } from '../../Protocols/utils'
import { ROBOT_MODEL_OT3 } from '../../../redux/discovery'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../redux/analytics'
import {
  getIsHeaterShakerAttached,
  useFeatureFlag,
} from '../../../redux/config'
import { ConfirmAttachedModal } from './ConfirmAttachedModal'
import { getLatestCurrentOffsets } from '../../../organisms/Devices/ProtocolRun/SetupLabwarePositionCheck/utils'
import { CloseButton, PlayButton } from './Buttons'

import type { Cutout, FixtureLoadName } from '@opentrons/shared-data'
import type { OnDeviceRouteParams } from '../../../App/types'

const FETCH_DURATION_MS = 5000
interface ProtocolSetupStepProps {
  onClickSetupStep: () => void
  status: 'ready' | 'not ready' | 'general'
  title: string
  // first line of detail text
  detail?: string | null
  // second line of detail text
  subDetail?: string | null
  // disallow click handler, disabled styling
  disabled?: boolean
  // display the reason the setup step is disabled
  disabledReason?: string | null
}

export function ProtocolSetupStep({
  onClickSetupStep,
  status,
  title,
  detail,
  subDetail,
  disabled = false,
  disabledReason,
}: ProtocolSetupStepProps): JSX.Element {
  const backgroundColorByStepStatus = {
    ready: COLORS.green3,
    'not ready': COLORS.yellow3,
    general: COLORS.light1,
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
        backgroundColor = COLORS.darkBlack40
        break
      case 'ready':
        backgroundColor = COLORS.green3Pressed
        break
      default:
        backgroundColor = COLORS.yellow3Pressed
    }
  } else backgroundColor = ''

  const PUSHED_STATE_STYLE = css`
    &:active {
      background-color: ${backgroundColor};
    }
  `

  return (
    <Btn
      onClick={() =>
        !disabled ? onClickSetupStep() : makeDisabledReasonSnackbar()
      }
      width="100%"
    >
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={
          disabled ? COLORS.light1 : backgroundColorByStepStatus[status]
        }
        borderRadius={BORDERS.borderRadiusSize4}
        gridGap={SPACING.spacing16}
        padding={`${SPACING.spacing20} ${SPACING.spacing24}`}
        css={PUSHED_STATE_STYLE}
      >
        {status !== 'general' && !disabled ? (
          <Icon
            color={status === 'ready' ? COLORS.green2 : COLORS.yellow2}
            size="2rem"
            name={status === 'ready' ? 'ot-check' : 'ot-alert'}
          />
        ) : null}
        <StyledText
          as="h4"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={disabled ? COLORS.darkBlack60 : COLORS.darkBlack100}
        >
          {title}
        </StyledText>
        <Flex flex="1" justifyContent={JUSTIFY_END}>
          <StyledText
            as="p"
            textAlign={TEXT_ALIGN_RIGHT}
            color={disabled ? COLORS.darkBlack60 : COLORS.darkBlack100}
          >
            {detail}
            {subDetail != null && detail != null ? <br /> : null}
            {subDetail}
          </StyledText>
        </Flex>
        {disabled ? null : (
          <Icon
            marginLeft={SPACING.spacing8}
            name="more"
            size="3rem"
            // Required to prevent inconsistent component height.
            style={{ backgroundColor: disabled ? 'transparent' : 'initial' }}
          />
        )}
      </Flex>
    </Btn>
  )
}

interface PrepareToRunProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  confirmAttachment: () => void
  play: () => void
  setupScreen: SetupScreens
}

function PrepareToRun({
  runId,
  setSetupScreen,
  confirmAttachment,
  play,
  setupScreen,
}: PrepareToRunProps): JSX.Element {
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])
  const history = useHistory()
  const { makeSnackbar } = useToaster()

  // Watch for scrolling to toggle dropshadow
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false)
  const observer = new IntersectionObserver(([entry]) => {
    setIsScrolled(!entry.isIntersecting)
  })
  if (scrollRef.current != null) {
    observer.observe(scrollRef.current)
  }

  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const { data: attachedInstruments } = useInstrumentsQuery()
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name ??
    ''
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const { launchLPC, LPCWizard } = useLaunchLPC(runId, protocolName)

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

  const runStatus = useRunStatus(runId)
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()

  const deckDef = getDeckDefFromRobotType(ROBOT_MODEL_OT3)

  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const { missingModuleIds } = getUnmatchedModulesForProtocol(
    attachedModules,
    protocolModulesInfo
  )
  const areInstrumentsReady =
    mostRecentAnalysis != null && attachedInstruments != null
      ? getAreInstrumentsReady(mostRecentAnalysis, attachedInstruments)
      : false

  const isMissingModules = missingModuleIds.length > 0
  const lpcDisabledReason = useLPCDisabledReason({
    runId,
    hasMissingModulesForOdd: isMissingModules,
    hasMissingCalForOdd: !areInstrumentsReady,
  })
  const requiredCalibration = attachedModules.some(
    module => module.moduleOffset?.last_modified == null
  )

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

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

  const instrumentsDetail = t('instruments_connected', {
    count: speccedInstrumentCount,
  })
  const instrumentsStatus = areInstrumentsReady ? 'ready' : 'not ready'

  const modulesStatus =
    isMissingModules || requiredCalibration ? 'not ready' : 'ready'

  const isReadyToRun = areInstrumentsReady && !isMissingModules

  const onPlay = (): void => {
    if (isDoorOpen) {
      makeSnackbar(t('shared:close_robot_door'))
    } else {
      if (
        isHeaterShakerInProtocol &&
        isReadyToRun &&
        (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)
      ) {
        confirmAttachment()
      } else {
        if (isReadyToRun) {
          play()
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

  // determine modules detail messages
  const connectedModulesText =
    protocolModulesInfo.length === 0
      ? t('no_modules_used_in_this_protocol')
      : t('modules_connected', {
          count: attachedModules.length,
        })
  const missingModulesText =
    missingModuleIds.length === 1
      ? `${t('missing')} ${firstMissingModuleDisplayName}`
      : t('multiple_modules_missing')

  const modulesDetail = (): string => {
    if (isMissingModules) {
      return missingModulesText
    } else if (requiredCalibration) {
      return t('calibration_required')
    } else {
      return connectedModulesText
    }
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

  const enableDeckConfig = useFeatureFlag('enableDeckConfiguration')

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
                  color={COLORS.darkGreyEnabled}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  overflowWrap="anywhere"
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
                  ? () => setShowConfirmCancelModal(true)
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
              onClickSetupStep={() => setSetupScreen('instruments')}
              title={t('instruments')}
              detail={instrumentsDetail}
              status={instrumentsStatus}
              disabled={speccedInstrumentCount === 0}
            />
            <ProtocolSetupStep
              onClickSetupStep={() => setSetupScreen('modules')}
              title={enableDeckConfig ? t('modules_and_deck') : t('modules')}
              detail={modulesDetail()}
              status={modulesStatus}
              disabled={protocolModulesInfo.length === 0}
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
              onClickSetupStep={() => setSetupScreen('labware')}
              title={t('labware')}
              detail={labwareDetail}
              subDetail={labwareSubDetail}
              status="general"
              disabled={labwareDetail == null}
            />
            <ProtocolSetupStep
              onClickSetupStep={() => setSetupScreen('liquids')}
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

export function ProtocolSetup(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const trackEvent = useTrackEvent()
  const { play } = useRunControls(runId)
  const handleProceedToRunClick = (): void => {
    trackEvent({ name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN, properties: {} })
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
  const [fixtureLocation, setFixtureLocation] = React.useState<Cutout>(
    '' as Cutout
  )
  const [providedFixtureOptions, setProvidedFixtureOptions] = React.useState<
    FixtureLoadName[]
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
        setupScreen={setupScreen}
      />
    ),
    instruments: (
      <ProtocolSetupInstruments runId={runId} setSetupScreen={setSetupScreen} />
    ),
    modules: (
      <ProtocolSetupModulesAndDeck
        runId={runId}
        setSetupScreen={setSetupScreen}
        setFixtureLocation={setFixtureLocation}
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
        fixtureLocation={fixtureLocation}
        runId={runId}
        setSetupScreen={setSetupScreen}
        providedFixtureOptions={providedFixtureOptions}
      />
    ),
  }

  return (
    <>
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
            : `${SPACING.spacing32} ${SPACING.spacing40}`
        }
      >
        {setupComponentByScreen[setupScreen]}
      </Flex>
    </>
  )
}
