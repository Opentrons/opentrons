import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Text,
  PrimaryBtn,
  useHoverTooltip,
  Tooltip,
  SPACING_2,
  SPACING_3,
  SIZE_6,
  C_BLUE,
  FONT_WEIGHT_BOLD,
  FONT_HEADER_THIN,
  Box,
} from '@opentrons/components'
import { Divider } from '../../../../atoms/structure'
import { CalibrateTipLengthControl } from '../../../../pages/Calibrate/CalibrateTipLengthControl'
import * as PipetteOffset from '../../../../redux/calibration/pipette-offset'
import * as Pipettes from '../../../../redux/pipettes'
import * as TipLength from '../../../../redux/calibration/tip-length'
import * as PipetteConstants from '../../../../redux/pipettes/constants'
import { DeckCalibration } from './DeckCalibration'
import { CalibrationItem } from './CalibrationItem'
import { PipetteCalibration } from './PipetteCalibration'

import type { Dispatch, State } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'
import type { ProtocolCalibrationStatus } from '../../../../redux/calibration/types'

import type { StepKey } from '../index'
interface Props {
  robot: ViewableRobot
  nextStep: StepKey
  expandNextStep: (step: StepKey) => void
  calibrationStatus: ProtocolCalibrationStatus
}

export function RobotCalibration(props: Props): JSX.Element {
  const { robot, nextStep, expandNextStep, calibrationStatus } = props
  const { name: robotName, status } = robot
  const { t } = useTranslation(['protocol_setup'])
  const nextStepButtonKey =
    nextStep === 'module_setup_step'
      ? 'proceed_to_module_setup_step'
      : 'proceed_to_labware_setup_step'
  const [targetProps, tooltipProps] = useHoverTooltip()

  const dispatch = useDispatch<Dispatch>()
  React.useEffect(() => {
    robotName && dispatch(Pipettes.fetchPipettes(robotName))
    robotName &&
      dispatch(PipetteOffset.fetchPipetteOffsetCalibrations(robotName))
    robotName && dispatch(TipLength.fetchTipLengthCalibrations(robotName))
  }, [dispatch, robotName, status])

  const protocolPipetteTipRackData = useSelector((state: State) => {
    return Pipettes.getProtocolPipetteTipRackCalInfo(state, robotName)
  })

  return (
    <>
      <DeckCalibration robotName={robotName} />
      <Divider marginY={SPACING_3} />
      <Text paddingBottom={SPACING_2} css={FONT_HEADER_THIN}>
        {t('required_pipettes_title')}
      </Text>
      <div>
        {PipetteConstants.PIPETTE_MOUNTS.map((mount, index) => {
          const pipetteTipRackData = protocolPipetteTipRackData[mount]
          if (pipetteTipRackData == null) {
            return null
          } else {
            return (
              <PipetteCalibration
                pipetteTipRackData={pipetteTipRackData}
                index={index}
                mount={mount}
                robotName={robotName}
              />
            )
          }
        })}
      </div>
      <Divider marginY={SPACING_3} />
      <Text css={FONT_HEADER_THIN}>{t('required_tip_racks_title')}</Text>
      <div>
        {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
          const pipetteTipRackData = protocolPipetteTipRackData[mount]
          if (pipetteTipRackData == null) {
            return null
          } else {
            return (
              <div key={mount}>
                <Text paddingY={SPACING_2} fontWeight={FONT_WEIGHT_BOLD}>
                  {pipetteTipRackData.pipetteDisplayName}
                </Text>
                {pipetteTipRackData.tipRacks.map((tipRack, index) => (
                  <CalibrationItem
                    key={index}
                    calibrated={tipRack.lastModifiedDate !== null}
                    calibratedDate={tipRack.lastModifiedDate}
                    index={index}
                    title={tipRack.displayName}
                    button={
                      <CalibrateTipLengthControl
                        mount={mount}
                        robotName={robotName}
                        hasCalibrated={tipRack.lastModifiedDate !== null}
                        tipRackDefinition={tipRack.tipRackDef}
                        isExtendedPipOffset={false}
                      />
                    }
                  />
                ))}
              </div>
            )
          }
        })}
      </div>
      <Divider marginY={SPACING_3} />
      <Box textAlign={'center'}>
        <PrimaryBtn
          disabled={!calibrationStatus.complete}
          onClick={() => expandNextStep(nextStep)}
          width={SIZE_6}
          backgroundColor={C_BLUE}
          {...targetProps}
        >
          {t(nextStepButtonKey)}
        </PrimaryBtn>
        {calibrationStatus.reason !== undefined && (
          <Tooltip {...tooltipProps}>{t(calibrationStatus.reason)}</Tooltip>
        )}
      </Box>
    </>
  )
}
