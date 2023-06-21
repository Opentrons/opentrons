import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import snakeCase from 'lodash/snakeCase'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  CheckboxField,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAllRunsQuery } from '@opentrons/react-api-client'

import { UNREACHABLE } from '../../../../../redux/discovery'
import { Slideout } from '../../../../../atoms/Slideout'
import { StyledText } from '../../../../../atoms/text'
import { Divider } from '../../../../../atoms/structure'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
} from '../../../../../redux/robot-admin'
import {
  useTrackEvent,
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
} from '../../../../../redux/analytics'
import {
  useDeckCalibrationData,
  useIsOT3,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
  useRobot,
} from '../../../hooks'

import type { State, Dispatch } from '../../../../../redux/types'
import type { ResetConfigRequest } from '../../../../../redux/robot-admin/types'

interface DeviceResetSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
  updateResetStatus: (connected: boolean, rOptions?: ResetConfigRequest) => void
}

export function DeviceResetSlideout({
  isExpanded,
  onCloseClick,
  robotName,
  updateResetStatus,
}: DeviceResetSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const doTrackEvent = useTrackEvent()
  const robot = useRobot(robotName)
  const dispatch = useDispatch<Dispatch>()
  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})
  const runsQueryResponse = useAllRunsQuery()
  const isOT3 = useIsOT3(robotName)

  // Calibration data
  const deckCalibrationData = useDeckCalibrationData(robotName)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()
  const tipLengthCalibrations = useTipLengthCalibrations()
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )

  const ot2CalibrationOptions =
    options != null ? options.filter(opt => opt.id.includes('Calibration')) : []
  const flexCalibrationOptions =
    options != null
      ? options.filter(
          opt =>
            opt.id === 'pipetteOffsetCalibrations' ||
            opt.id === 'gripperOffsetCalibrations'
        )
      : []

  const calibrationOptions = isOT3
    ? flexCalibrationOptions
    : ot2CalibrationOptions

  const bootScriptOption =
    options != null ? options.filter(opt => opt.id.includes('bootScript')) : []
  const runHistoryOption =
    options != null ? options.filter(opt => opt.id.includes('runsHistory')) : []

  React.useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [dispatch, robotName])

  const downloadCalibrationLogs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
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

  const downloadRunHistoryLogs: React.MouseEventHandler = e => {
    e.preventDefault()
    const runsHistory =
      runsQueryResponse != null ? runsQueryResponse.data?.data : []
    saveAs(
      new Blob([JSON.stringify(runsHistory)]),
      `opentrons-${robotName}-runsHistory.json`
    )
  }

  const handleClearData = (): void => {
    const reachable = robot?.status !== UNREACHABLE
    updateResetStatus(reachable, resetOptions)
    onCloseClick()
  }

  return (
    <Slideout
      title={t('device_reset')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          disabled={!(Object.values(resetOptions).find(val => val) ?? false)}
          onClick={handleClearData}
          width="100%"
        >
          {t('clear_data_and_restart_robot')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.warningBackgroundLight}
          borderRadius={BORDERS.borderRadiusSize1}
          padding={SPACING.spacing8}
          border={`1px solid ${COLORS.warningEnabled}`}
          marginBottom={SPACING.spacing24}
        >
          <Icon
            name="alert-circle"
            size="1rem"
            marginRight={SPACING.spacing8}
            color={COLORS.warningEnabled}
          />
          <StyledText as="p">{t('resets_cannot_be_undone')}</StyledText>
        </Flex>
        {/* Note: (kj:06/07/2023) this part will be updated when be is ready */}
        {isOT3 ? (
          <>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing20}>
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('factory_reset')}
                </StyledText>
                <StyledText as="p" marginTop={SPACING.spacing8}>
                  {t('factory_reset_description')}
                </StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('clear_all_stored_data')}
                </StyledText>
                <StyledText as="p" marginTop={SPACING.spacing8}>
                  {t('clear_all_stored_data_description')}
                </StyledText>
              </Flex>
            </Flex>
            <Divider marginY={SPACING.spacing16} />
          </>
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('clear_individual_data')}
          </StyledText>
          <StyledText as="p">
            {t('device_reset_slideout_description')}
          </StyledText>
          <Flex
            marginTop={SPACING.spacing20}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing20}
            paddingX={SPACING.spacing16}
          >
            <Box>
              <Flex
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                marginBottom="0.625rem"
              >
                <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
                  {t('robot_calibration_data')}
                </StyledText>
                <Link
                  role="button"
                  css={TYPOGRAPHY.linkPSemiBold}
                  onClick={downloadCalibrationLogs}
                >
                  {t('download')}
                </Link>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={-SPACING.spacing4}
              >
                {calibrationOptions.map(opt => {
                  let calibrationName = ''
                  if (opt.id === 'pipetteOffsetCalibrations') {
                    calibrationName = isOT3
                      ? t('clear_option_pipette_calibrations')
                      : t(`clear_option_${snakeCase(opt.id)}`)
                  } else {
                    calibrationName = t(`clear_option_${snakeCase(opt.id)}`)
                  }
                  return (
                    calibrationName !== '' && (
                      <CheckboxField
                        key={opt.id}
                        onChange={() =>
                          setResetOptions({
                            ...resetOptions,
                            [opt.id]: !(resetOptions[opt.id] ?? false),
                          })
                        }
                        value={resetOptions[opt.id]}
                        label={calibrationName}
                      />
                    )
                  )
                })}
              </Flex>
            </Box>
            <Box>
              <Flex
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                marginBottom={SPACING.spacing8}
              >
                <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
                  {t('protocol_run_history')}
                </StyledText>
                <Link
                  role="button"
                  css={TYPOGRAPHY.linkPSemiBold}
                  onClick={downloadRunHistoryLogs}
                >
                  {t('download')}
                </Link>
              </Flex>
              {runHistoryOption.map(opt => (
                <CheckboxField
                  key={opt.id}
                  onChange={() =>
                    setResetOptions({
                      ...resetOptions,
                      [opt.id]: !(resetOptions[opt.id] ?? false),
                    })
                  }
                  value={resetOptions[opt.id]}
                  label={t(`clear_option_${snakeCase(opt.id)}`)}
                />
              ))}
            </Box>
            <Box>
              <StyledText
                as="p"
                css={TYPOGRAPHY.pSemiBold}
                marginBottom={SPACING.spacing8}
              >
                {t('boot_scripts')}
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
                  label={t(`clear_option_${snakeCase(opt.id)}`)}
                />
              ))}
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Slideout>
  )
}
