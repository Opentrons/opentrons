import * as React from 'react'
import { saveAs } from 'file-saver'
import { useTranslation, Trans } from 'react-i18next'

import {
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import {
  useDeckCalibrationData,
  useIsOT3,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
} from '../../organisms/Devices/hooks'
import { useTrackEvent } from '../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../redux/calibration'

// TODO(bc, 2022-02-08): replace with support article when available
const FLEX_CALIBRATION_SUPPORT_URL = 'https://support.opentrons.com'

interface CalibrationDataDownloadProps {
  robotName: string
  setShowHowCalibrationWorksModal: (
    showHowCalibrationWorksModal: boolean
  ) => void
}

export function CalibrationDataDownload({
  robotName,
  setShowHowCalibrationWorksModal,
}: CalibrationDataDownloadProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])
  const doTrackEvent = useTrackEvent()

  const robot = useRobot(robotName)
  const isOT3 = useIsOT3(robotName)
  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()
  const tipLengthCalibrations = useTipLengthCalibrations()

  const downloadIsPossible =
    deckCalibrationData.isDeckCalibrated &&
    pipetteOffsetCalibrations != null &&
    pipetteOffsetCalibrations.length > 0 &&
    tipLengthCalibrations != null &&
    tipLengthCalibrations.length > 0

  const ot3DownloadIsPossible =
    isOT3 &&
    pipetteOffsetCalibrations != null &&
    pipetteOffsetCalibrations.length > 0

  const onClickSaveAs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: EVENT_CALIBRATION_DOWNLOADED,
      properties: {},
    })
    saveAs(
      new Blob([
        isOT3
          ? JSON.stringify({
              pipetteOffset: pipetteOffsetCalibrations,
            })
          : JSON.stringify({
              deck: deckCalibrationData,
              pipetteOffset: pipetteOffsetCalibrations,
              tipLength: tipLengthCalibrations,
            }),
      ]),
      `opentrons-${robotName}-calibration.json`
    )
  }

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      paddingTop={SPACING.spacing5}
    >
      <Flex gridGap={SPACING.spacing3} flexDirection={DIRECTION_COLUMN}>
        <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {isOT3
            ? t('about_calibration_title')
            : t('robot_calibration:download_calibration_title')}
        </StyledText>
        {isOT3 ? (
          <>
            <Trans
              t={t}
              i18nKey="about_calibration_description_ot3"
              components={{
                block: <StyledText as="p" />,
              }}
            />
            <Link
              external
              css={TYPOGRAPHY.linkPSemiBold}
              href={FLEX_CALIBRATION_SUPPORT_URL}
            >
              {t('robot_calibration:see_how_robot_calibration_works')}
            </Link>
          </>
        ) : (
          <StyledText as="p">
            {t(
              downloadIsPossible
                ? 'robot_calibration:download_calibration_data_available'
                : 'robot_calibration:download_calibration_data_unavailable'
            )}
          </StyledText>
        )}
      </Flex>
      <TertiaryButton
        onClick={onClickSaveAs}
        disabled={isOT3 ? !ot3DownloadIsPossible : !downloadIsPossible}
      >
        <Flex alignItems={ALIGN_CENTER}>
          <Icon name="download" size="0.75rem" marginRight={SPACING.spacing3} />
          {t('download_calibration_data')}
        </Flex>
      </TertiaryButton>
    </Flex>
  )
}
