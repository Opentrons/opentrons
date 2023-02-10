import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useInterval,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import * as TipLength from '../../../redux/calibration/tip-length'
import { useRunPipetteInfoByMount } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'
import { SetupTipLengthCalibrationButton } from './SetupTipLengthCalibrationButton'

import type { Dispatch } from '../../../redux/types'

const CALIBRATIONS_FETCH_MS = 5000
interface SetupTipLengthCalibrationProps {
  robotName: string
  runId: string
}

export function SetupTipLengthCalibration({
  robotName,
  runId,
}: SetupTipLengthCalibrationProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'devices_landing'])
  const dispatch = useDispatch<Dispatch>()
  const runPipetteInfoByMount = useRunPipetteInfoByMount(robotName, runId)

  useInterval(
    () =>
      robotName != null &&
      dispatch(TipLength.fetchTipLengthCalibrations(robotName)),
    CALIBRATIONS_FETCH_MS,
    true
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
      <StyledText
        color={COLORS.black}
        css={TYPOGRAPHY.pSemiBold}
        id="TipRackCalibration_requiredTipLengthTitle"
      >
        {t('required_tip_racks_title')}
      </StyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        if (pipetteInfo == null) {
          return null
        } else {
          return (
            <React.Fragment key={mount}>
              {pipetteInfo.tipRacksForPipette.map((tipRackInfo, index) => {
                const pipetteNotAttached =
                  pipetteInfo.requestedPipetteMatch === 'incompatible'
                return (
                  <SetupCalibrationItem
                    key={index}
                    calibratedDate={tipRackInfo.lastModifiedDate}
                    label={pipetteInfo.pipetteSpecs?.displayName}
                    title={tipRackInfo.displayName}
                    subText={
                      pipetteNotAttached
                        ? t('attach_pipette_tip_length_calibration')
                        : undefined
                    }
                    button={
                      <SetupTipLengthCalibrationButton
                        mount={mount}
                        disabled={pipetteNotAttached}
                        robotName={robotName}
                        runId={runId}
                        hasCalibrated={tipRackInfo.lastModifiedDate !== null}
                        tipRackDefinition={tipRackInfo.tipRackDef}
                        isExtendedPipOffset={false}
                      />
                    }
                    runId={runId}
                  />
                )
              })}
            </React.Fragment>
          )
        }
      })}
    </Flex>
  )
}
