import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import first from 'lodash/first'

import {
  Btn,
  Flex,
  Icon,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_ALIGN_RIGHT,
  truncateString,
  TYPOGRAPHY,
  BORDERS,
  SPACING,
  POSITION_STICKY,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunQuery,
  useAllPipetteOffsetCalibrationsQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'
import {
  getDeckDefFromRobotType,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { Skeleton } from '../../atoms/Skeleton'
import {
  useAttachedModules,
  useLPCDisabledReason,
} from '../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupLabware } from '../../organisms/ProtocolSetupLabware'
import { ProtocolSetupModules } from '../../organisms/ProtocolSetupModules'
import { ProtocolSetupLiquids } from '../../organisms/ProtocolSetupLiquids'
import { ProtocolSetupInstruments } from '../../organisms/ProtocolSetupInstruments'
import { useLaunchLPC } from '../../organisms/LabwarePositionCheck/useLaunchLPC'
import { ProtocolSetupLabwarePositionCheck } from '../../organisms/ProtocolSetupLabwarePositionCheck'
import { getUnmatchedModulesForProtocol } from '../../organisms/ProtocolSetupModules/utils'
import { ConfirmCancelRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol'
import {
  getAreInstrumentsReady,
  getProtocolUsesGripper,
} from '../../organisms/ProtocolSetupInstruments/utils'
import { useRunControls } from '../../organisms/RunTimeControl/hooks'
import { useToaster } from '../../organisms/ToasterOven'
import { getLabwareSetupItemGroups } from '../../pages/Protocols/utils'
import { ROBOT_MODEL_OT3 } from '../../redux/discovery'

import type { OnDeviceRouteParams } from '../../App/types'

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

function ProtocolSetupStep({
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
          <Icon marginLeft={SPACING.spacing8} name="more" size="3rem" />
        )}
      </Flex>
    </Btn>
  )
}

// TODO(ew, 05/03/2023): refactor the run buttons into a shared component
interface CloseButtonProps {
  onClose: () => void
}

function CloseButton({ onClose }: CloseButtonProps): JSX.Element {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.red2}
      borderRadius="6.25rem"
      display={DISPLAY_FLEX}
      height="6.25rem"
      justifyContent={JUSTIFY_CENTER}
      width="6.25rem"
      onClick={onClose}
      aria-label="close"
    >
      <Icon color={COLORS.white} name="close-icon" size="2.5rem" />
    </Btn>
  )
}

interface PlayButtonProps {
  disabled: boolean
  onPlay: () => void
}

function PlayButton({ disabled, onPlay }: PlayButtonProps): JSX.Element {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={disabled ? COLORS.darkBlack20 : COLORS.blueEnabled}
      borderRadius="6.25rem"
      display={DISPLAY_FLEX}
      height="6.25rem"
      justifyContent={JUSTIFY_CENTER}
      width="6.25rem"
      disabled={disabled}
      onClick={onPlay}
      aria-label="play"
    >
      <Icon
        color={disabled ? COLORS.darkBlack60 : COLORS.white}
        name="play-icon"
        size="2.5rem"
      />
    </Btn>
  )
}

interface PrepareToRunProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

function PrepareToRun({
  runId,
  setSetupScreen,
}: PrepareToRunProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const history = useHistory()
  const { makeSnackbar } = useToaster()

  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const { data: attachedInstruments } = useInstrumentsQuery()
  const {
    data: allPipettesCalibrationData,
  } = useAllPipetteOffsetCalibrationsQuery()
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const { launchLPC, LPCWizard } = useLaunchLPC(runId)

  const { play } = useRunControls(runId)

  const onConfirmCancelClose = (): void => {
    setShowConfirmCancelModal(false)
    history.goBack()
  }

  const protocolHasModules =
    mostRecentAnalysis?.modules != null &&
    mostRecentAnalysis?.modules.length > 0
  const attachedModules = useAttachedModules()

  const deckDef = getDeckDefFromRobotType(ROBOT_MODEL_OT3)

  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const { missingModuleIds } = getUnmatchedModulesForProtocol(
    attachedModules,
    protocolModulesInfo
  )

  const isMissingModules = missingModuleIds.length > 0
  const lpcDisabledReason = useLPCDisabledReason({
    runId,
    hasMissingModulesForOdd: isMissingModules,
    hasMissingPipCalForOdd: allPipettesCalibrationData == null,
  })

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  if (
    mostRecentAnalysis == null ||
    attachedInstruments == null ||
    (protocolHasModules && attachedModules == null) ||
    allPipettesCalibrationData == null
  ) {
    return <ProtocolSetupSkeleton cancelAndClose={onConfirmCancelClose} />
  }

  const areInstrumentsReady = getAreInstrumentsReady(
    mostRecentAnalysis,
    attachedInstruments,
    allPipettesCalibrationData
  )
  const speccedInstrumentCount =
    mostRecentAnalysis.pipettes.length +
    (getProtocolUsesGripper(mostRecentAnalysis) ? 1 : 0)
  const instrumentsDetail = t('instruments_connected', {
    count: speccedInstrumentCount,
  })
  const instrumentsStatus = areInstrumentsReady ? 'ready' : 'not ready'

  const modulesStatus = isMissingModules ? 'not ready' : 'ready'

  const isReadyToRun = areInstrumentsReady && !isMissingModules

  const onPlay = (): void => {
    if (isReadyToRun) {
      play()
    } else {
      makeSnackbar(
        i18n.format(t('complete_setup_before_proceeding'), 'capitalize')
      )
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

  const modulesDetail = isMissingModules
    ? missingModulesText
    : connectedModulesText

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

  // Liquids information
  const liquidsInProtocol = mostRecentAnalysis?.liquids ?? []

  return (
    <>
      {/* Protocol Setup Header */}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        paddingBottom={SPACING.spacing40}
        paddingTop={SPACING.spacing32}
        position={POSITION_STICKY}
        top={0}
        backgroundColor={COLORS.white}
        overflowY="hidden"
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing2}
            maxWidth="43rem"
          >
            <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
              {t('prepare_to_run')}
            </StyledText>
            <StyledText
              as="h4"
              color={COLORS.darkGreyEnabled}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              overflowWrap="anywhere"
            >
              {truncateString(protocolName as string, 100)}
            </StyledText>
          </Flex>
          <Flex gridGap={SPACING.spacing16}>
            <CloseButton onClose={() => setShowConfirmCancelModal(true)} />
            <PlayButton
              disabled={
                mostRecentAnalysis == null ||
                attachedInstruments == null ||
                (protocolHasModules && attachedModules == null) ||
                allPipettesCalibrationData == null
              }
              onPlay={onPlay}
            />
          </Flex>
        </Flex>
      </Flex>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        <ProtocolSetupStep
          onClickSetupStep={() => setSetupScreen('instruments')}
          title={t('instruments')}
          detail={instrumentsDetail}
          status={instrumentsStatus}
        />
        <ProtocolSetupStep
          onClickSetupStep={() => setSetupScreen('modules')}
          title={t('modules')}
          detail={modulesDetail}
          status={modulesStatus}
          disabled={protocolModulesInfo.length === 0}
        />
        <ProtocolSetupStep
          onClickSetupStep={launchLPC}
          title={t('labware_position_check')}
          detail={t(
            lpcDisabledReason != null ? 'currently_unavailable' : 'recommended'
          )}
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
        />
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

export function ProtocolSetup(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()

  // orchestrate setup subpages/components
  const [setupScreen, setSetupScreen] = React.useState<SetupScreens>(
    'prepare to run'
  )
  const setupComponentByScreen = {
    'prepare to run': (
      <PrepareToRun runId={runId} setSetupScreen={setSetupScreen} />
    ),
    instruments: (
      <ProtocolSetupInstruments runId={runId} setSetupScreen={setSetupScreen} />
    ),
    modules: (
      <ProtocolSetupModules runId={runId} setSetupScreen={setSetupScreen} />
    ),
    labware: (
      <ProtocolSetupLabware runId={runId} setSetupScreen={setSetupScreen} />
    ),
    lpc: (
      <ProtocolSetupLabwarePositionCheck
        runId={runId}
        setSetupScreen={setSetupScreen}
      />
    ),
    liquids: (
      <ProtocolSetupLiquids runId={runId} setSetupScreen={setSetupScreen} />
    ),
  }

  return (
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
  )
}

interface ProtocolSetupSkeletonProps {
  cancelAndClose: () => void
}
function ProtocolSetupSkeleton(props: ProtocolSetupSkeletonProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      marginTop={SPACING.spacing40}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.25rem">
          <Skeleton height="2rem" width="7rem" backgroundSize="64rem" />
          <Skeleton height="2rem" width="28rem" backgroundSize="64rem" />
        </Flex>
        <Flex gridGap={SPACING.spacing24}>
          <CloseButton onClose={() => props.cancelAndClose()} />
          <PlayButton disabled onPlay={() => {}} />
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <Skeleton height="6rem" width="100%" backgroundSize="64rem" />
        <Skeleton height="6rem" width="100%" backgroundSize="64rem" />
        <Skeleton height="6rem" width="100%" backgroundSize="64rem" />
        <Skeleton height="6rem" width="100%" backgroundSize="64rem" />
      </Flex>
    </Flex>
  )
}
