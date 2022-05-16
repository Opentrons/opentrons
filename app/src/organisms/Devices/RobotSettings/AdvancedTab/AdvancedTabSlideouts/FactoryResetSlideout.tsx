import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  Link,
  COLORS,
  CheckboxField,
} from '@opentrons/components'
import { Slideout } from '../../../../../atoms/Slideout'
import { PrimaryButton } from '../../../../../atoms/buttons'
import { StyledText } from '../../../../../atoms/text'
import { Divider } from '../../../../../atoms/structure'
import { Banner } from '../../../../../atoms/Banner'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
} from '../../../../../redux/robot-admin'
import { useTrackEvent } from '../../../../../redux/analytics'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
  useRobot,
} from '../../../hooks'

import type { State, Dispatch } from '../../../../../redux/types'
import type { ResetConfigRequest } from '../../../../../redux/robot-admin/types'

interface FactoryResetSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
  updateResetStatus: (connected: boolean, rOptions?: ResetConfigRequest) => void
}

export function FactoryResetSlideout({
  isExpanded,
  onCloseClick,
  robotName,
  updateResetStatus,
}: FactoryResetSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const doTrackEvent = useTrackEvent()
  const robot = useRobot(robotName)
  const dispatch = useDispatch<Dispatch>()
  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})

  // Calibration data
  const deckCalibrationData = useDeckCalibrationData(robotName)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )

  // TODO(koji 4/28/2022): This should be temporary. Need to wait for the CPX team's update of Protocol resetOptions.
  const calibrationOptions =
    options != null ? options.filter(opt => opt.id.includes('Calibration')) : []
  const bootScriptOption =
    options != null ? options.filter(opt => opt.id.includes('bootScript')) : []

  React.useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [dispatch, robotName])

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

  const handleClearData = (): void => {
    const connected = robot?.status !== 'unreachable'
    updateResetStatus(connected, resetOptions)
    onCloseClick()
  }

  return (
    <Slideout
      title={t('factory_reset_slideout_title')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          disabled={!(Object.values(resetOptions).find(val => val) ?? false)}
          onClick={handleClearData}
          width="100%"
        >
          {t('factory_reset_slideout_data_clear_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {t('factory_reset_slideout_description')}
        </StyledText>
        <Banner type="warning">
          {t('factory_reset_slideout_warning_message')}
        </Banner>
        <Divider marginY={SPACING.spacing4} />
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginBottom={SPACING.spacing3}
        >
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
        <StyledText as="p" marginBottom={SPACING.spacing3}>
          {t('factory_reset_slideout_calibration_description')}
        </StyledText>
        {calibrationOptions.map(opt => (
          <CheckboxField
            key={opt.id}
            onChange={() =>
              setResetOptions({
                ...resetOptions,
                [opt.id]: !(resetOptions[opt.id] ?? false),
              })
            }
            value={resetOptions[opt.id]}
            label={`Clear ${opt.name}`}
          />
        ))}
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginBottom={SPACING.spacing3}
        >
          <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
            {t('factory_reset_slideout_protocol_run_history_title')}
          </StyledText>
          <Link
            color={COLORS.blue}
            css={TYPOGRAPHY.pSemiBold}
            onClick={downloadCalibrationLogs}
          >
            {t('factory_reset_slideout_download_logs_link')}
          </Link>
        </Flex>
        <StyledText
          as="p"
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing3}
        >
          {t('factory_reset_slideout_boot_scripts_title')}
        </StyledText>
        {bootScriptOption.map(opt => (
          <CheckboxField
            key={opt.id}
            onChange={() =>
              setResetOptions({
                ...resetOptions,
                [opt.id]: !(resetOptions[opt.id] ?? false),
              })
            }
            value={resetOptions[opt.id]}
            label={`Clear ${opt.name}`}
          />
        ))}
      </Flex>
    </Slideout>
  )
}
