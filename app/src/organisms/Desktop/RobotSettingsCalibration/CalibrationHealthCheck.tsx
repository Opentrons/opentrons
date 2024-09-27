import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  Tooltip,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { TertiaryButton } from '/app/atoms/buttons'
import { AskForCalibrationBlockModal } from '../CalibrateTipLength/AskForCalibrationBlockModal'
import {
  useTrackEvent,
  ANALYTICS_CALIBRATION_HEALTH_CHECK_BUTTON_CLICKED,
} from '/app/redux/analytics'
import * as Calibration from '/app/redux/calibration'
import * as Config from '/app/redux/config'
import * as Pipettes from '/app/redux/pipettes'
import * as Sessions from '/app/redux/sessions'
import { useRunStatuses } from '/app/resources/runs'
import {
  useAttachedPipettes,
  useAttachedPipetteCalibrations,
} from '/app/resources/instruments'
import { useDeckCalibrationStatus } from '/app/resources/calibration'

import type {
  AttachedPipettesByMount,
  PipetteCalibrationsByMount,
} from '/app/redux/pipettes/types'
import type { DispatchRequestsType } from '/app/redux/robot-api'

interface CalibrationHealthCheckProps {
  buttonDisabledReason: string | null
  dispatchRequests: DispatchRequestsType
  isPending: boolean
  robotName: string
}

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

export function CalibrationHealthCheck({
  buttonDisabledReason,
  dispatchRequests,
  isPending,
  robotName,
}: CalibrationHealthCheckProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])
  const doTrackEvent = useTrackEvent()
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const [showCalBlockModal, setShowCalBlockModal] = useState(false)

  const deckCalibrationStatus = useDeckCalibrationStatus(robotName)
  const attachedPipettes = useAttachedPipettes()
  const attachedPipetteCalibrations = useAttachedPipetteCalibrations()

  const { isRunRunning: isRunning } = useRunStatuses()

  const pipetteCalPresent = attachedPipetteCalPresent(
    attachedPipettes,
    attachedPipetteCalibrations
  )

  const pipettePresent =
    !(attachedPipettes.left == null) || !(attachedPipettes.right == null)

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)

  const healthCheckIsPossible =
    !([
      Calibration.DECK_CAL_STATUS_SINGULARITY,
      Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
      Calibration.DECK_CAL_STATUS_IDENTITY,
    ] as Array<typeof deckCalibrationStatus>).includes(deckCalibrationStatus) &&
    pipetteCalPresent &&
    pipettePresent

  const calCheckButtonDisabled = healthCheckIsPossible
    ? Boolean(buttonDisabledReason) || isPending || isRunning
    : true

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

  const handleHealthCheckClick = (): void => {
    handleHealthCheck(null)
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_HEALTH_CHECK_BUTTON_CLICKED,
      properties: {},
    })
  }

  return (
    <Flex
      paddingY={SPACING.spacing24}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('calibration_health_check_title')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('calibration_health_check_description')}
        </LegacyStyledText>
      </Flex>
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
      {showCalBlockModal
        ? createPortal(
            <AskForCalibrationBlockModal
              onResponse={handleHealthCheck}
              titleBarTitle={t('robot_calibration:health_check_title')}
              closePrompt={() => {
                setShowCalBlockModal(false)
              }}
            />,
            getTopPortalEl()
          )
        : null}
    </Flex>
  )
}
