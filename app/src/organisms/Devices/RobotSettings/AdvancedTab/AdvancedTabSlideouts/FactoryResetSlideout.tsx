import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  CheckboxField,
  DIRECTION_ROW,
  Link,
  COLORS,
} from '@opentrons/components'
import { Slideout } from '../../../../../atoms/Slideout'
import { PrimaryButton } from '../../../../../atoms/Buttons'
import { StyledText } from '../../../../../atoms/text'
import { Divider } from '../../../../../atoms/structure'
import { getRobotByName } from '../../../../../redux/discovery'
import { useTrackEvent } from '../../../../../redux/analytics'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
} from '../../../hooks'

import type { State } from '../../../../../redux/types'

interface FactoryResetSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string // maybe robot
}

export function FactoryResetSlideout({
  isExpanded,
  onCloseClick,
  robotName,
}: FactoryResetSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const doTrackEvent = useTrackEvent()
  const robot = useSelector((state: State) => getRobotByName(state, robotName))

  // Calibration data
  const deckCalibrationData = useDeckCalibrationData(robotName)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)

  // Protocol run history data

  const downloadCalibrationLogs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: 'EVENT_CALIBRATION_DOWNLOADED',
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
      `opentrons-${robotName}=calibration.json`
    )
  }

  const handleConnectionCheck = (): void => {
    const { connected } = robot
    // true factory reset modal
    // false reconnect modal
  }

  return (
    <Slideout
      title={t('factory_reset')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton disabled={true} onClick={() => {}} width="100%">
          {t('factory_reset_slideout_data_clear_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">{t('')}</StyledText>
        {/* warning */}
        <Divider />
        <Flex flexDirection={DIRECTION_ROW}>
          <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
            {t('factory_reset_slideout_calibration_title')}
          </StyledText>
          <Link
            color={COLORS.blue}
            css={TYPOGRAPHY.pSemiBold}
            onClick={downloadCalibrationLogs}
          >
            {t('factory_reset_slideout_download_logs_link')}
          </Link>
        </Flex>

        <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
          {t('factory_reset_slideout_protocol_run_history_title')}
        </StyledText>
        <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
          {t('factory_reset_slideout_boot_scripts_title')}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
