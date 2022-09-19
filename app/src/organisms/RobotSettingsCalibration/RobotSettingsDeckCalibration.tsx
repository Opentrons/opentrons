import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  Link,
  ALIGN_CENTER,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { formatLastModified } from '../../organisms/DeprecatedCalibrationPanels/utils'
import {
  useDeckCalibrationData,
  useRobot,
  useDeckCalibrationStatus,
  useAttachedPipettes,
  useRunStartedOrLegacySessionInProgress,
} from '../../organisms/Devices/hooks'
import * as Calibration from '../../redux/calibration'
import * as Config from '../../redux/config'
import * as RobotApi from '../../redux/robot-api'
import * as Sessions from '../../redux/sessions'

import type { DeckCalibrationInfo } from '../../redux/calibration/types'
import type { RequestState } from '../../redux/robot-api/types'
import type { DispatchRequestsType } from '../../redux/robot-api'
import type { State } from '../../redux/types'

interface RobotSettingsDeckCalibrationProps {
  buttonDisabledReason: string | null
  dispatchRequests: DispatchRequestsType
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export function RobotSettingsDeckCalibration({
  buttonDisabledReason,
  dispatchRequests,
  robotName,
  updateRobotStatus,
}: RobotSettingsDeckCalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)

  const isRunStartedOrLegacySessionInProgress = useRunStartedOrLegacySessionInProgress()

  const robot = useRobot(robotName)
  const deckCalibrationStatus = useDeckCalibrationStatus(robotName)
  const enableCalibrationWizards = Config.useFeatureFlag(
    'enableCalibrationWizards'
  )

  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const attachedPipettes = useAttachedPipettes()

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

  const handleStartDeckCalSession = (): void => {
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  const deckCalibrationButtonText =
    deckCalibrationStatus &&
    deckCalibrationStatus !== Calibration.DECK_CAL_STATUS_IDENTITY
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

  const deckCalData = deckCalibrationData.deckCalibrationData as DeckCalibrationInfo
  const calibratedDate = deckCalData?.lastModified ?? null
  const deckLastModified = Boolean(calibratedDate)
    ? t('last_calibrated', {
        date: formatLastModified(calibratedDate),
      })
    : t('not_calibrated')

  const handleClickDeckCalibration = (): void => {
    if (isRunStartedOrLegacySessionInProgress) {
      updateRobotStatus(true)
    } else {
      handleStartDeckCalSession()
    }
  }

  let currentDeckStatus: 'error' | 'warning' | null = null
  if (
    deckCalibrationStatus != null &&
    deckCalibrationStatus !== Calibration.DECK_CAL_STATUS_OK
  ) {
    currentDeckStatus = 'error'
  } else if (
    !Array.isArray(deckCalibrationData.deckCalibrationData) &&
    deckCalibrationData?.deckCalibrationData?.status != null &&
    deckCalibrationData?.deckCalibrationData?.status.markedBad
  ) {
    currentDeckStatus = 'warning'
  }

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

  return (
    <>
      {deckCalibrationBanner}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('deck_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {/* TODO(bh, 2022-09-07): remove legacy description when calibration wizard feature flag removed */}
              {enableCalibrationWizards
                ? t('deck_calibration_description')
                : t('deck_calibration_description_legacy')}
            </StyledText>
            <StyledText as="label" color={COLORS.darkGreyEnabled}>
              {deckLastModified}
            </StyledText>
          </Box>
          {enableCalibrationWizards ? null : (
            <TertiaryButton
              onClick={handleClickDeckCalibration}
              disabled={disabledOrBusyReason != null}
            >
              {deckCalibrationButtonText}
            </TertiaryButton>
          )}
        </Flex>
      </Box>
    </>
  )
}
