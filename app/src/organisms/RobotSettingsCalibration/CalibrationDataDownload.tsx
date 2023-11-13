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
import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import {
  useDeckCalibrationData,
  useIsFlex,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
} from '../../organisms/Devices/hooks'
import {
  useTrackEvent,
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
} from '../../redux/analytics'

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
  const isFlex = useIsFlex(robotName)
  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()
  const tipLengthCalibrations = useTipLengthCalibrations()
  const { data: attachedInstruments } = useInstrumentsQuery({ enabled: isFlex })
  const { data: attachedModules } = useModulesQuery({ enabled: isFlex })

  const ot2DownloadIsPossible =
    deckCalibrationData.isDeckCalibrated &&
    pipetteOffsetCalibrations != null &&
    pipetteOffsetCalibrations.length > 0 &&
    tipLengthCalibrations != null &&
    tipLengthCalibrations.length > 0

  const onClickSaveAs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: {},
    })
    saveAs(
      new Blob([
        isFlex
          ? JSON.stringify({
              instrumentData: attachedInstruments,
              moduleData: attachedModules,
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
      gridGap={SPACING.spacing40}
    >
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {isFlex
            ? t('about_calibration_title')
            : t('robot_calibration:download_calibration_title')}
        </StyledText>
        {isFlex ? (
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
              ot2DownloadIsPossible
                ? 'robot_calibration:download_calibration_data_available'
                : 'robot_calibration:download_calibration_data_unavailable'
            )}
          </StyledText>
        )}
      </Flex>
      <TertiaryButton
        onClick={onClickSaveAs}
        disabled={isFlex ? false : !ot2DownloadIsPossible} // always enable download on Flex
      >
        <Flex alignItems={ALIGN_CENTER}>
          <Icon name="download" size="0.75rem" marginRight={SPACING.spacing8} />
          {t('download_calibration_data')}
        </Flex>
      </TertiaryButton>
    </Flex>
  )
}
