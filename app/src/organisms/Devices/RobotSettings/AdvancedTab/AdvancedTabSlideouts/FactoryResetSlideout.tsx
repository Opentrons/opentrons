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
  Box,
  Icon,
  COLORS,
  SIZE_1,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useAllRunsQuery } from '@opentrons/react-api-client'

import { Slideout } from '../../../../../atoms/Slideout'
import { PrimaryButton } from '../../../../../atoms/buttons'
import { StyledText } from '../../../../../atoms/text'
import { Divider } from '../../../../../atoms/structure'
import { CheckboxField } from '../../../../../atoms/CheckboxField'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
} from '../../../../../redux/robot-admin'
import { useTrackEvent } from '../../../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../../../redux/calibration'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
  useRobot,
} from '../../../hooks'

import type { State, Dispatch } from '../../../../../redux/types'
import type { ResetConfigRequest } from '../../../../../redux/robot-admin/types'
import { UNREACHABLE } from '../../../../../redux/discovery'

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
  const runsQueryResponse = useAllRunsQuery()

  // Calibration data
  const deckCalibrationData = useDeckCalibrationData(robotName)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )

  const calibrationOptions =
    options != null ? options.filter(opt => opt.id.includes('Calibration')) : []
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
      title={t('factory_reset_slideout_title')}
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
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {t('factory_reset_slideout_description')}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon
            name="alert-circle"
            size={SIZE_1}
            marginRight={SPACING.spacing3}
            color={COLORS.warningEnabled}
          />
          <StyledText as="p" color={COLORS.warningText}>
            {t('factory_resets_cannot_be_undone')}
          </StyledText>
        </Flex>
        <Divider marginY={SPACING.spacing4} />
        <Box>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacing3}
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
          <StyledText as="p" marginBottom={SPACING.spacing3}>
            {t('calibration_description')}
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
        </Box>
        <Box marginTop={SPACING.spacing5}>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacing3}
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
          <StyledText as="p" marginBottom={SPACING.spacing3}>
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
              label={`${opt.name}`}
            />
          ))}
        </Box>
        <Box marginTop={SPACING.spacing5}>
          <StyledText
            as="p"
            css={TYPOGRAPHY.pSemiBold}
            marginBottom={SPACING.spacing3}
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
              label={`Clear ${opt.name}`}
            />
          ))}
        </Box>
      </Flex>
    </Slideout>
  )
}
