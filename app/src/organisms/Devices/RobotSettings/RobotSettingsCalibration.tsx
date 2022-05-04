import * as React from 'react'
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
  useHoverTooltip,
  TOOLTIP_LEFT,
} from '@opentrons/components'

import { TertiaryButton } from '../../../atoms/Buttons'
import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { DeckCalibrationModal } from '../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { useTrackEvent } from '../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../redux/calibration'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
} from '../hooks'
import { CheckCalibrationControl } from '../../../pages/Robots/RobotSettings/CheckCalibrationControl'
import { Tooltip } from '../../../atoms/Tooltip'

interface CalibrationProps {
  robotName: string
}

export function RobotSettingsCalibration({
  robotName,
}: CalibrationProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const doTrackEvent = useTrackEvent()

  const [
    showDeckCalibrationModal,
    setShowDeckCalibrationModal,
  ] = React.useState(false)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const robot = useRobot(robotName)

  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)
  const tipLengthCalibrations = useTipLengthCalibrations(robot?.name)
  const isHealthCheckDisabled = deckCalibrationData.isDeckCalibrated

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

  return (
    <>
      <Box paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER}>
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
      {/* TODO: additional calibration content here */}
      <CheckCalibrationControl
        targetProps={targetProps}
        robotName={robotName}
        disabledReason={
          !isHealthCheckDisabled
            ? t('fully_calibrate_before_checking_health')
            : null
        }
      >
        <>
          {!isHealthCheckDisabled && (
            <Tooltip
              key={`RobotSettingsCalibration_tooltip`}
              tooltipProps={tooltipProps}
            >
              {t('fully_calibrate_before_checking_health')}
            </Tooltip>
          )}
        </>
      </CheckCalibrationControl>
    </>
  )
}
