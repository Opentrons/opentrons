import * as React from 'react'
import { saveAs } from 'file-saver'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Box,
  Flex,
  Link,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useConditionalConfirm,
  Mount,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { TertiaryButton } from '../../../atoms/Buttons'
import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { DeckCalibrationModal } from '../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'

import { useTrackEvent } from '../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../redux/calibration'
import { getDeckCalibrationSession } from '../../../redux/sessions/deck-calibration/selectors'
import * as RobotApi from '../../../redux/robot-api'
import * as Config from '../../../redux/config'
import * as Sessions from '../../../redux/sessions'

import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
  useAttachedPipettes,
} from '../hooks'
import { CalibrateDeck } from '../../../organisms/CalibrateDeck'
import { DeckCalibrationConfirmModal } from './DeckCalibrationConfirmModal'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'
import { TipLengthCalibrationItems } from './CalibrationDetails/TipLengthCalibrationItems'

import type { State } from '../../../redux/types'
import type { RequestState } from '../../../redux/robot-api/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../../redux/sessions/types'

interface CalibrationProps {
  robotName: string
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

export function RobotSettingsCalibration({
  robotName,
}: CalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'shared',
    'robot_calibration',
  ])
  const doTrackEvent = useTrackEvent()

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

  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const robot = useRobot(robotName)

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
  const attachedPipettes = useAttachedPipettes(
    robot?.name != null ? robot.name : null
  )

  const pipettePresent =
    attachedPipettes != null
      ? !(attachedPipettes.left == null) || !(attachedPipettes.right == null)
      : false

  const isPending =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const createRequest = useSelector((state: State) =>
    createRequestId.current
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )
  const createStatus = createRequest?.status

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const handleStartDeckCalSession = (): void => {
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }
  const pipOffsetDataPresent =
    pipetteOffsetCalibrations != null
      ? pipetteOffsetCalibrations.length > 0
      : false

  const deckCalibrationSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  const {
    showConfirmation: showConfirmStart,
    confirm: confirmStart,
    cancel: cancelStart,
  } = useConditionalConfirm(handleStartDeckCalSession, !!pipOffsetDataPresent)

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
        modelName: attachedPipettes.left?.modelSpecs.displayName,
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
        modelName: attachedPipettes.right?.modelSpecs.displayName,
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
    if (
      pipetteOffsetCalibrations === null ||
      Object.values(pipetteOffsetCalibrations).length <= 1
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
      if (markedBads !== null) {
        setShowPipetteOffsetCalibrationBanner(true)
        setPipetteOffsetCalBannerType('warning')
      } else {
        setShowPipetteOffsetCalibrationBanner(false)
      }
    }
  }

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  React.useEffect(() => {
    checkPipetteCalibrationMissing()
  }, [pipettePresent, pipetteOffsetCalibrations])

  console.log(attachedPipettes)

  return (
    <>
      <Portal level="top">
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleHealthCheck}
            titleBarTitle={t('robot_calibration:health_check_title')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        <CalibrateDeck
          session={deckCalibrationSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={isPending}
          isJogging={isJogging}
        />
        {showConfirmStart && pipOffsetDataPresent && (
          <DeckCalibrationConfirmModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        )}
      </Portal>
      {/* About Calibration this comment will removed when finish all sections */}
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
              color={COLORS.blue}
              css={TYPOGRAPHY.pRegular}
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
      {/* PipetteOffsetCalibrations Section */}
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
        <Flex alignItems={ALIGN_CENTER}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('pipette_offset_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('pipette_offset_calibrations_description')}
            </StyledText>
            {pipetteOffsetCalibrations != null ? (
              <PipetteOffsetCalibrationItems
                robotName={robotName}
                formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
              />
            ) : (
              <StyledText as="label">{t('not_calibrated')}</StyledText>
            )}
          </Box>
        </Flex>
      </Box>
      <Line />
      {/* TipLengthCalibrations Section */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('tip_length_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('tip_length_calibrations_description')}
            </StyledText>
            {tipLengthCalibrations != null &&
            tipLengthCalibrations.length !== 0 ? (
              <TipLengthCalibrationItems
                robotName={robotName}
                formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
                formattedTipLengthCalibrations={formatTipLengthCalibrations()}
              />
            ) : (
              <StyledText as="label">{t('not_calibrated')}</StyledText>
            )}
          </Box>
        </Flex>
      </Box>
    </>
  )
}
