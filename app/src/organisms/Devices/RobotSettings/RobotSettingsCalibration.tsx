import * as React from 'react'
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
  useAttachedPipettes,
} from '../hooks'

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

  const robot = useRobot(robotName)

  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)
  const tipLengthCalibrations = useTipLengthCalibrations(robot?.name)
  const attachedPipettes = useAttachedPipettes(robot?.name != null ? robot.name : null)

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

  console.log('pipetteOffsetCalibrations', pipetteOffsetCalibrations)
  console.log('tipLengthCalibrations', tipLengthCalibrations)
  console.log('attachedPipettes', attachedPipettes)

  return (
    <>
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
      {/* Deck Calibration this comment will removed when finish all sections */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('deck_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('deck_calibration_description')}
            </StyledText>
            {showDeckCalibrationModal ? (
              <DeckCalibrationModal
                onCloseClick={() => setShowDeckCalibrationModal(false)}
              />
            ) : null}
          </Box>
          <TertiaryButton onClick={onClickSaveAs}>
            {t('deck_calibration_recalibrate_button')}
          </TertiaryButton>
        </Flex>
      </Box>
      <Line />
      {/* Pipette Offset Calibrations this comment will removed when finish all sections */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('pipette_offset_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('pipette_offset_calibrations_description')}
            </StyledText>
            {pipetteOffsetCalibrations?.map(calibration =>
            <>
            <StyledText as="p">{calibration?.pipette}</StyledText>
              <StyledText as="p">{calibration?.offset}</StyledText>
              <StyledText as="p">{calibration.mount}</StyledText>
              <StyledText as="p">{calibration.}</StyledText>
            </>
            )}
          </Box>
        </Flex>
      </Box>
      <Line />
      {/* Tip Length Calibrations this comment will removed when finish all sections */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('tip_length_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('tip_length_calibrations_description')}
            </StyledText>
            {showDeckCalibrationModal ? (
              <DeckCalibrationModal
                onCloseClick={() => setShowDeckCalibrationModal(false)}
              />
            ) : null}
          </Box>
        </Flex>
      </Box>
      <Line />
      {/* Calibration Health Check this comment will removed when finish all sections */}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_description')}
            </StyledText>
            {showDeckCalibrationModal ? (
              <DeckCalibrationModal
                onCloseClick={() => setShowDeckCalibrationModal(false)}
              />
            ) : null}
          </Box>
          <TertiaryButton onClick={onClickSaveAs}>
            {t('calibration_health_check_button')}
          </TertiaryButton>
        </Flex>
      </Box>
    </>
  )
}
