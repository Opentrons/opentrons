import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import snakeCase from 'lodash/snakeCase'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  PrimaryButton,
  Link,
  Box,
  Icon,
  COLORS,
  SIZE_1,
  ALIGN_CENTER,
  CheckboxField,
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
    // TODO(bh, 2022-11-07): update OT-2 filter when gripper calibration reset config option available
    options != null ? options.filter(opt => opt.id.includes('Calibration')) : []
  const ot3CalibrationOptions =
    options != null
      ? options.filter(
          opt =>
            opt.id === 'pipetteOffsetCalibrations' ||
            // TODO(bh, 2022-11-07): confirm or update when gripper calibration reset config option available
            opt.id === 'gripperCalibration'
        )
      : []

  const calibrationOptions = isOT3
    ? ot3CalibrationOptions
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
        <StyledText as="p" marginBottom={SPACING.spacing16}>
          {t('factory_reset_slideout_description')}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon
            name="alert-circle"
            size={SIZE_1}
            marginRight={SPACING.spacing8}
            color={COLORS.warningEnabled}
          />
          <StyledText as="p" color={COLORS.warningText}>
            {t('factory_resets_cannot_be_undone')}
          </StyledText>
        </Flex>
        <Divider marginY={SPACING.spacing16} />
        <Box>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacing8}
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
          {isOT3 ? null : (
            <StyledText as="p" marginBottom={SPACING.spacing8}>
              {t('calibration_description')}
            </StyledText>
          )}
          {calibrationOptions.map(opt => {
            const calibrationName =
              isOT3 && opt.id === 'pipetteOffsetCalibrations'
                ? t('clear_option_pipette_calibrations')
                : t(`clear_option_${snakeCase(opt.id)}`)
            return (
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
          })}
          {/* TODO(bh, 2022-11-02): placeholder, remove when gripper calibration reset config option available */}
          {isOT3 ? (
            <CheckboxField
              key="gripperCalibration"
              onChange={() =>
                setResetOptions({
                  ...resetOptions,
                  gripperCalibration: !(
                    resetOptions.gripperCalibration ?? false
                  ),
                })
              }
              value={resetOptions.gripperCalibration}
              label={t('clear_option_gripper_calibration')}
            />
          ) : null}
        </Box>
        <Box marginTop={SPACING.spacing24}>
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
          <StyledText as="p" marginBottom={SPACING.spacing8}>
            {t('protocol_run_history_description')}
          </StyledText>
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
        <Box marginTop={SPACING.spacing24}>
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
    </Slideout>
  )
}
