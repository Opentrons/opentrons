import * as React from 'react'
import { useSelector } from 'react-redux'
import { saveAs } from 'file-saver'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  Link,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_DECORATION_UNDERLINE,
  useConditionalConfirm,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { TertiaryButton } from '../../../atoms/Buttons'
import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { DeckCalibrationModal } from '../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { formatLastModified } from '../../../organisms/CalibrationPanels/utils'
import { useTrackEvent } from '../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../redux/calibration'
import { getDeckCalibrationSession } from '../../../redux/sessions/deck-calibration/selectors'
import { CONNECTABLE } from '../../../redux/discovery'
import { selectors as robotSelectors } from '../../../redux/robot'
import * as RobotApi from '../../../redux/robot-api'
import * as Sessions from '../../../redux/sessions'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
  useAttachedPipettes,
} from '../hooks'
import { CalibrateDeck } from '../../../organisms/CalibrateDeck'

import type { State } from '../../../redux/types'
import type { RequestState } from '../../../redux/robot-api/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../../redux/sessions/types'

const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]
interface CalibrationProps {
  robotName: string
}

export function RobotSettingsCalibration({
  robotName,
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

  const [
    showDeckCalibrationModal,
    setShowDeckCalibrationModal,
  ] = React.useState(false)

  const robot = useRobot(robotName)
  const notConnectable = robot?.status !== CONNECTABLE
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

  const isRunning = useSelector(robotSelectors.getIsRunning)
  const pipettePresent =
    attachedPipettes != null
      ? !(attachedPipettes.left == null) || !(attachedPipettes.right == null)
      : false
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
    // showConfirmation: showConfirmStart,
    confirm: confirmStart,
    // cancel: cancelStart,
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

  let buttonDisabledReason = null
  if (notConnectable) {
    buttonDisabledReason = t('shared:disabled_cannot_connect')
  } else if (!robot.connected) {
    buttonDisabledReason = t('shared:disabled_connect_to_robot')
  } else if (isRunning) {
    buttonDisabledReason = t('shared:disabled_protocol_is_running')
  } else if (!pipettePresent) {
    buttonDisabledReason = t('shared:disabled_no_pipette_attached')
  }

  const deckCalibrationButtonText = deckCalibrationData.isDeckCalibrated
    ? t('deck_calibration_recalibrate_button')
    : t('deck_calibration_calibrate_button')

  const disabledOrBusyReason = isPending
    ? t('robot_calibration:deck_calibration_spinner', {
        ongoing_action:
          createStatus === RobotApi.PENDING
            ? t('shared:starting')
            : t('shared:ending'),
      })
    : buttonDisabledReason

  const deckLastModified = (): string => {
    const calibratedDate =
      deckCalibrationData.deckCalibrationData?.lastModified ?? null
    return Boolean(calibratedDate)
      ? t('last_calibrated', {
          date: formatLastModified(calibratedDate),
        })
      : t('not_calibrated')
  }

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

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
      </Portal>
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
      {deckCalibrationButtonText === t('deck_calibration_calibrate_button') && (
        <Banner type="error">
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            <StyledText as="p">{t('deck_calibration_missing')}</StyledText>
            <Link
              role="button"
              color={COLORS.darkBlack}
              css={TYPOGRAPHY.pRegular}
              textDecoration={TEXT_DECORATION_UNDERLINE}
              onClick={() => confirmStart()}
            >
              {t('calibrate_now')}
            </Link>
          </Flex>
        </Banner>
      )}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('deck_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('deck_calibration_description')}
            </StyledText>
            <StyledText as="label">{deckLastModified()}</StyledText>
          </Box>
          <TertiaryButton
            onClick={() => confirmStart()}
            disabled={disabledOrBusyReason}
          >
            {deckCalibrationButtonText}
          </TertiaryButton>
        </Flex>
      </Box>
      {/* TODO: 5/6/2022 kj the rest of sections will be solved other PRs */}
    </>
  )
}
