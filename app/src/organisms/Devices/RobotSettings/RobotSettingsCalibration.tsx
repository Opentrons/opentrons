import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { saveAs } from 'file-saver'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  Link,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useHoverTooltip,
  TOOLTIP_LEFT,
  Mount,
  SpinnerModalPage,
  AlertModal,
  useInterval,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { TertiaryButton } from '../../../atoms/buttons'
import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { Tooltip } from '../../../atoms/Tooltip'
import { DeckCalibrationModal } from '../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { CalibrateDeck } from '../../../organisms/CalibrateDeck'
import { formatLastModified } from '../../../organisms/CalibrationPanels/utils'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import { CheckCalibration } from '../../../organisms/CheckCalibration'
import { useTrackEvent } from '../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../redux/calibration'
import { getDeckCalibrationSession } from '../../../redux/sessions/deck-calibration/selectors'
import { CONNECTABLE } from '../../../redux/discovery'
import { selectors as robotSelectors } from '../../../redux/robot'
import * as RobotApi from '../../../redux/robot-api'
import * as Config from '../../../redux/config'
import * as Sessions from '../../../redux/sessions'
import * as Calibration from '../../../redux/calibration'
import * as Pipettes from '../../../redux/pipettes'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
  useDeckCalibrationStatus,
  useAttachedPipettes,
  useAttachedPipetteCalibrations,
  useRunStartedOrLegacySessionInProgress,
} from '../hooks'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'
import { TipLengthCalibrationItems } from './CalibrationDetails/TipLengthCalibrationItems'

import type { State, Dispatch } from '../../../redux/types'
import type { RequestState } from '../../../redux/robot-api/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../../redux/sessions/types'
import type { DeckCalibrationInfo } from '../../../redux/calibration/types'
import type {
  AttachedPipettesByMount,
  PipetteCalibrationsByMount,
} from '../../../redux/pipettes/types'

const CALS_FETCH_MS = 5000

interface CalibrationProps {
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export interface FormattedPipetteOffsetCalibration {
  modelName?: string
  serialNumber?: string
  mount: Mount
  tiprack?: string
  lastCalibrated?: string
  markedBad?: boolean
}

export interface FormattedTipLengthCalibration {
  tiprack: string
  pipette: string
  lastCalibrated: string
  markedBad: boolean
  uri?: string | null
}

const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

const attachedPipetteCalPresent: (
  pipettes: AttachedPipettesByMount,
  pipetteCalibrations: PipetteCalibrationsByMount
) => boolean = (pipettes, pipetteCalibrations) =>
  !Pipettes.PIPETTE_MOUNTS.some(
    mount =>
      pipettes?.[mount] != null &&
      (pipetteCalibrations[mount]?.offset == null ||
        pipetteCalibrations[mount]?.tipLength == null)
  )

export function RobotSettingsCalibration({
  robotName,
  updateRobotStatus,
}: CalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])
  const doTrackEvent = useTrackEvent()
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const [
    showDeckCalibrationModal,
    setShowDeckCalibrationModal,
  ] = React.useState(false)
  const [
    showPipetteOffsetCalibrationBanner,
    setShowPipetteOffsetCalibrationBanner,
  ] = React.useState<boolean>(false)
  const [
    pipetteOffsetCalBannerType,
    setPipetteOffsetCalBannerType,
  ] = React.useState<string>('')
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)
  const isRunStartedOrLegacySessionInProgress = useRunStartedOrLegacySessionInProgress()

  const robot = useRobot(robotName)
  const notConnectable = robot?.status !== CONNECTABLE
  const deckCalStatus = useSelector((state: State) => {
    return Calibration.getDeckCalibrationStatus(state, robotName)
  })
  const deckCalibrationStatus = useDeckCalibrationStatus(robotName)
  const dispatch = useDispatch<Dispatch>()

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)
  const tipLengthCalibrations = useTipLengthCalibrations(robot?.name)
  const attachedPipettes = useAttachedPipettes()
  const attachedPipetteCalibrations = useAttachedPipetteCalibrations(robotName)

  const isRunning = useSelector(robotSelectors.getIsRunning)

  const pipetteCalPresent = attachedPipetteCalPresent(
    attachedPipettes,
    attachedPipetteCalibrations
  )

  const pipettePresent =
    !(attachedPipettes.left == null) || !(attachedPipettes.right == null)

  const isPending =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current != null
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const createRequest = useSelector((state: State) =>
    createRequestId.current != null
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )

  const createStatus = createRequest?.status

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current != null
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const handleStartDeckCalSession = (): void => {
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  const deckCalibrationSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  let buttonDisabledReason: string | null = null
  if (notConnectable) {
    buttonDisabledReason = t('shared:disabled_cannot_connect')
  } else if (isRunning) {
    buttonDisabledReason = t('shared:disabled_protocol_is_running')
  } else if (!pipettePresent) {
    buttonDisabledReason = t('shared:disabled_no_pipette_attached')
  }

  const healthCheckIsPossible =
    !([
      Calibration.DECK_CAL_STATUS_SINGULARITY,
      Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
      Calibration.DECK_CAL_STATUS_IDENTITY,
    ] as Array<typeof deckCalStatus>).includes(deckCalStatus) &&
    pipetteCalPresent &&
    pipettePresent

  const calCheckButtonDisabled = healthCheckIsPossible
    ? Boolean(buttonDisabledReason) || isPending || isRunning
    : true

  const onClickSaveAs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: EVENT_CALIBRATION_DOWNLOADED,
      properties: {},
    })
    saveAs(
      new Blob([
        JSON.stringify({
          deck: deckCalibrationData,
          pipetteOffset: pipetteOffsetCalibrations,
          tipLength: tipLengthCalibrations,
        }),
      ]),
      `opentrons-${robotName}-calibration.json`
    )
  }

  const deckCalibrationButtonText =
    deckCalStatus && deckCalStatus !== Calibration.DECK_CAL_STATUS_IDENTITY
      ? t('recalibrate_deck')
      : t('calibrate_deck')

  const disabledOrBusyReason = isPending
    ? t('robot_calibration:deck_calibration_spinner', {
        ongoing_action:
          createStatus === RobotApi.PENDING
            ? t('shared:starting')
            : t('shared:ending'),
      })
    : buttonDisabledReason

  const deckLastModified = (): string => {
    const deckCalData = deckCalibrationData.deckCalibrationData as DeckCalibrationInfo
    const calibratedDate = deckCalData?.lastModified ?? null
    return Boolean(calibratedDate)
      ? t('last_calibrated', {
          date: formatLastModified(calibratedDate),
        })
      : t('not_calibrated')
  }

  const checkHealthSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    ) {
      // TODO: add this analytics event when we deprecate this event firing in redux/analytics makeEvent
      return session
    }
    return null
  })

  const handleHealthCheck = (
    hasBlockModalResponse: boolean | null = null
  ): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      setShowCalBlockModal(false)
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
          {
            tipRacks: [],
            hasCalibrationBlock: Boolean(
              configHasCalibrationBlock ?? hasBlockModalResponse
            ),
          }
        )
      )
    }
  }

  const formatPipetteOffsetCalibrations = (): FormattedPipetteOffsetCalibration[] => {
    const pippets = []
    if (attachedPipettes != null) {
      pippets.push({
        modelName: attachedPipettes.left?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.left?.id,
        mount: 'left' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.status.markedBad,
      })
      pippets.push({
        modelName: attachedPipettes.right?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.right?.id,
        mount: 'right' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.status.markedBad,
      })
    }
    return pippets
  }

  const formatTipLengthCalibrations = (): FormattedTipLengthCalibration[] => {
    const tipLengths: FormattedTipLengthCalibration[] = []
    tipLengthCalibrations?.map(tipLength =>
      tipLengths.push({
        tiprack: tipLength.tiprack,
        pipette: tipLength.pipette,
        lastCalibrated: tipLength.lastModified,
        markedBad: tipLength.status.markedBad,
        uri: tipLength.uri,
      })
    )
    return tipLengths
  }

  const checkPipetteCalibrationMissing = (): void => {
    // checked the number of attached pipettes
    const numberOfAttached =
      attachedPipettes != null &&
      Object.keys(attachedPipettes)
        .map(mount => attachedPipettes[mount as Mount] != null)
        .filter(x => x).length
    const isPipettesNumberMatched =
      numberOfAttached === formatPipetteOffsetCalibrations().length
    if (
      pipetteOffsetCalibrations === null ||
      (Object.values(pipetteOffsetCalibrations).length <= 1 &&
        isPipettesNumberMatched)
    ) {
      setShowPipetteOffsetCalibrationBanner(true)
      setPipetteOffsetCalBannerType('error')
    } else {
      const left = attachedPipettes?.left?.id
      const right = attachedPipettes?.right?.id
      const markedBads =
        pipetteOffsetCalibrations?.filter(
          p =>
            (p.pipette === left && p.status.markedBad) ||
            (p.pipette === right && p.status.markedBad)
        ) ?? null
      if (markedBads.length !== 0 && isPipettesNumberMatched) {
        setShowPipetteOffsetCalibrationBanner(true)
        setPipetteOffsetCalBannerType('warning')
      } else {
        setShowPipetteOffsetCalibrationBanner(false)
      }
    }
  }

  const handleClickDeckCalibration = (): void => {
    if (isRunStartedOrLegacySessionInProgress) {
      updateRobotStatus(true)
    } else {
      handleStartDeckCalSession()
    }
  }

  const checkDeckCalibrationStatus = (): 'error' | 'warning' | null => {
    if (
      deckCalibrationStatus != null &&
      deckCalibrationStatus !== Calibration.DECK_CAL_STATUS_OK
    ) {
      return 'error'
    } else if (
      !Array.isArray(deckCalibrationData.deckCalibrationData) &&
      deckCalibrationData?.deckCalibrationData?.status != null &&
      deckCalibrationData?.deckCalibrationData?.status.markedBad
    ) {
      return 'warning'
    } else {
      return null
    }
  }

  const currentDeckStatus = checkDeckCalibrationStatus()

  const deckCalibrationBanner = !pipettePresent
    ? currentDeckStatus === 'error' && (
        <Banner marginTop={SPACING.spacing5} type="error">
          <StyledText>{t('deck_calibration_missing_no_pipette')}</StyledText>
        </Banner>
      )
    : currentDeckStatus != null && (
        <Banner
          marginTop={SPACING.spacing5}
          type={currentDeckStatus === 'error' ? 'error' : 'warning'}
        >
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            <StyledText as="p">
              {currentDeckStatus === 'error'
                ? t('deck_calibration_missing')
                : t('deck_calibration_recommended')}
            </StyledText>
            <Link
              role="button"
              color={COLORS.darkBlackEnabled}
              css={TYPOGRAPHY.pRegular}
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              onClick={() => handleClickDeckCalibration()}
            >
              {currentDeckStatus === 'error'
                ? t('calibrate_now')
                : t('recalibrate_now')}
            </Link>
          </Flex>
        </Banner>
      )

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  // Note: following fetch need to reflect the latest state of calibrations
  // when a user does calibration or rename a robot.
  useInterval(
    () => {
      dispatch(Calibration.fetchCalibrationStatus(robotName))
      dispatch(Calibration.fetchPipetteOffsetCalibrations(robotName))
      dispatch(Calibration.fetchTipLengthCalibrations(robotName))
      checkPipetteCalibrationMissing()
    },
    CALS_FETCH_MS,
    true
  )

  const handleHealthCheckClick = (): void => {
    handleHealthCheck(null)
    doTrackEvent({
      name: 'calibrationHealthCheckButtonClicked',
      properties: {},
    })
  }

  return (
    <>
      <Portal level="top">
        <CalibrateDeck
          session={deckCalibrationSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={isPending}
          isJogging={isJogging}
        />
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleHealthCheck}
            titleBarTitle={t('robot_calibration:health_check_title')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}

        {createStatus === RobotApi.PENDING ? (
          <SpinnerModalPage
            titleBar={{
              title: t('robot_calibration:health_check_title'),
              back: {
                disabled: true,
                title: t('shared:exit'),
                children: t('shared:exit'),
              },
            }}
          />
        ) : null}
        <CheckCalibration
          session={checkHealthSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={isPending}
          isJogging={isJogging}
        />
        {createStatus === RobotApi.FAILURE && (
          <AlertModal
            alertOverlay
            heading={t('robot_calibration:deck_calibration_failure')}
            buttons={[
              {
                children: t('shared:ok'),
                onClick: () => {
                  createRequestId.current &&
                    dispatch(RobotApi.dismissRequest(createRequestId.current))
                  createRequestId.current = null
                },
              },
            ]}
          >
            <StyledText>{t('deck_calibration_error_occurred')}</StyledText>
            <StyledText>
              {createRequest != null &&
                'error' in createRequest &&
                createRequest.error != null &&
                RobotApi.getErrorResponseMessage(createRequest.error)}
            </StyledText>
          </AlertModal>
        )}
      </Portal>
      {/* Calibration Data Download Section */}
      <Box paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('about_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('about_calibration_description')}
            </StyledText>
            {showDeckCalibrationModal ? (
              <DeckCalibrationModal
                onCloseClick={() => setShowDeckCalibrationModal(false)}
              />
            ) : null}
            <Link
              role="button"
              css={TYPOGRAPHY.linkPSemiBold}
              onClick={() => setShowDeckCalibrationModal(true)}
            >
              {t('see_how_robot_calibration_works')}
            </Link>
          </Box>
          <TertiaryButton onClick={onClickSaveAs}>
            {t('download_calibration_data')}
          </TertiaryButton>
        </Flex>
      </Box>
      <Line />
      {/* DeckCalibration Section */}
      {deckCalibrationBanner}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('deck_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('deck_calibration_description')}
            </StyledText>
            <StyledText as="label" color={COLORS.darkGreyEnabled}>
              {deckLastModified()}
            </StyledText>
          </Box>
          <TertiaryButton
            onClick={() => handleClickDeckCalibration()}
            disabled={disabledOrBusyReason != null}
          >
            {deckCalibrationButtonText}
          </TertiaryButton>
        </Flex>
      </Box>
      <Line
        marginBottom={
          showPipetteOffsetCalibrationBanner ? SPACING.spacing4 : null
        }
      />
      {/* Pipette Offset Calibration Section */}
      {showPipetteOffsetCalibrationBanner && (
        <Banner
          type={pipetteOffsetCalBannerType === 'error' ? 'error' : 'warning'}
        >
          {pipetteOffsetCalBannerType === 'error'
            ? t('pipette_offset_calibration_missing')
            : t('pipette_offset_calibration_recommended')}
        </Banner>
      )}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('pipette_offset_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('pipette_offset_calibrations_description')}
            </StyledText>
          </Box>
          {pipetteOffsetCalibrations != null ? (
            <PipetteOffsetCalibrationItems
              robotName={robotName}
              formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
              updateRobotStatus={updateRobotStatus}
            />
          ) : (
            <StyledText as="label">{t('not_calibrated')}</StyledText>
          )}
        </Flex>
      </Box>
      <Line />
      {/* Tip Length Calibration Section */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('tip_length_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('tip_length_calibrations_description')}
            </StyledText>
          </Box>
          {tipLengthCalibrations != null &&
          tipLengthCalibrations.length !== 0 ? (
            <TipLengthCalibrationItems
              robotName={robotName}
              formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
              formattedTipLengthCalibrations={formatTipLengthCalibrations()}
              updateRobotStatus={updateRobotStatus}
            />
          ) : (
            <StyledText as="label">{t('not_calibrated')}</StyledText>
          )}
        </Flex>
      </Box>
      <Line />
      {/* Calibration Health Check Section */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing2}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_description')}
            </StyledText>
          </Box>
          <TertiaryButton
            {...targetProps}
            onClick={handleHealthCheckClick}
            disabled={calCheckButtonDisabled}
          >
            {t('health_check')}
          </TertiaryButton>
          {calCheckButtonDisabled && (
            <Tooltip tooltipProps={tooltipProps}>
              {t('fully_calibrate_before_checking_health')}
            </Tooltip>
          )}
        </Flex>
      </Box>
    </>
  )
}
