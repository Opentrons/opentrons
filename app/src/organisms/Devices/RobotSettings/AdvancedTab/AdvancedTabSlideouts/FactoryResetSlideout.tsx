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
  CheckboxField,
  Link,
  COLORS,
} from '@opentrons/components'
import { Slideout } from '../../../../../atoms/Slideout'
import { PrimaryButton } from '../../../../../atoms/Buttons'
import { StyledText } from '../../../../../atoms/text'
import { Divider } from '../../../../../atoms/structure'
import { Banner } from '../../../../../atoms/Banner'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
} from '../../../../../redux/robot-admin'
import { getRobotByName } from '../../../../../redux/discovery'
import { useTrackEvent } from '../../../../../redux/analytics'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
} from '../../../hooks'

import type { State, Dispatch } from '../../../../../redux/types'
import type {
  ResetConfigOption,
  ResetConfigRequest,
} from '../../../../../redux/robot-admin/types'

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
  const robot = useSelector((state: State) => getRobotByName(state, robotName))
  const dispatch = useDispatch<Dispatch>()

  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})
  // const [optionIds, setOptionIds] = React.useState<string[]>([])
  const [bootScriptOption, setBootScriptOption] = React.useState<
    ResetConfigOption[]
  >([])
  const [calibrationOptions, setCalibrationOptions] = React.useState<
    ResetConfigOption[]
  >([])
  const [protocolOptions, setProtocolOptions] = React.useState<
    ResetConfigOption[]
  >([])

  // Calibration data
  const deckCalibrationData = useDeckCalibrationData(robotName)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )

  React.useEffect(() => {
    const cOptions = options.filter(option => {
      if (option.id.includes('Calibration')) {
        return option
      }
    })
    setCalibrationOptions(cOptions)
  }, [options])

  React.useEffect(() => {
    const bOption = options.filter(option => {
      if (option.id.includes('boot')) {
        return option
      }
    })
    setBootScriptOption(bOption)
  }, [options])

  React.useEffect(() => {
    const pOption = options.filter(option => {
      if (option.id.includes('protocol')) {
        return option
      }
    })
    setProtocolOptions(pOption)
  }, [options])

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
    // first check connection
    const connected = robot?.connected ?? false
    updateResetStatus(connected, resetOptions)
    onCloseClick()
  }

  return (
    <Slideout
      title={t('factory_reset_slideout_title')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton disabled={true} onClick={handleClearData} width="100%">
          {t('factory_reset_slideout_data_clear_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {t('factory_reset_slideout_description')}
        </StyledText>
        <Banner
          type="warning"
          title={t('factory_reset_slideout_warning_message')}
        />
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
        {calibrationOptions &&
          calibrationOptions.map(opt => (
            <CheckboxField
              key={opt.id}
              onChange={() =>
                setResetOptions({
                  ...resetOptions,
                  [opt.id]: !resetOptions[opt.id],
                })
              }
              value={resetOptions[opt.id]}
            >
              <StyledText>{`Clear ${opt.name}`}</StyledText>
            </CheckboxField>
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
        {protocolOptions &&
          protocolOptions.map(option => (
            <StyledText
              as="p"
              key={option.id}
            >{`Clear ${option.name}`}</StyledText>
          ))}

        <StyledText
          as="p"
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing3}
        >
          {t('factory_reset_slideout_boot_scripts_title')}
        </StyledText>
        {bootScriptOption &&
          bootScriptOption.map(opt => (
            <CheckboxField
              key={opt.id}
              onChange={() =>
                setResetOptions({
                  ...resetOptions,
                  [opt.id]: !resetOptions[opt.id],
                })
              }
              value={resetOptions[opt.id]}
            >
              <StyledText as="p">{`Clear ${opt.name}`}</StyledText>
            </CheckboxField>
          ))}
      </Flex>
    </Slideout>
  )
}
