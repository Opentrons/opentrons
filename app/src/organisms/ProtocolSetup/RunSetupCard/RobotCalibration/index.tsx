import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Text,
  PrimaryBtn,
  useHoverTooltip,
  Tooltip,
  SPACING_2,
  SPACING_3,
  ALIGN_CENTER,
  C_BLUE,
  FONT_WEIGHT_SEMIBOLD,
  FONT_HEADER_THIN,
  Box,
} from '@opentrons/components'
import { Divider } from '../../../../atoms/structure'
import * as PipetteOffset from '../../../../redux/calibration/pipette-offset'
import * as Pipettes from '../../../../redux/pipettes'
import * as TipLength from '../../../../redux/calibration/tip-length'
import * as PipetteConstants from '../../../../redux/pipettes/constants'
import { DeckCalibration } from './DeckCalibration'
import { CalibrationItem } from './CalibrationItem'
import { PipetteCalibration } from './PipetteCalibration'
import { TipLengthCalibration } from './TipLengthCalibration'
import { useCurrentRunPipetteInfoByMount } from '../hooks/useCurrentRunPipetteInfoByMount'

import type { Dispatch } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'
import type { ProtocolCalibrationStatus } from '../../../../redux/calibration/types'

import type { StepKey } from '../index'
interface Props {
  robot: ViewableRobot
  nextStep: StepKey
  expandStep: (step: StepKey) => void
  calibrationStatus: ProtocolCalibrationStatus
}

export function RobotCalibration(props: Props): JSX.Element {
  const { robot, nextStep, expandStep, calibrationStatus } = props
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

  const currentRunPipetteInfoByMount = useCurrentRunPipetteInfoByMount()

  return (
    <>
      <DeckCalibration robotName={robotName} />
      <Divider marginY={SPACING_3} />
      <Text
        as="h2"
        paddingBottom={SPACING_2}
        css={FONT_HEADER_THIN}
        id={`PipetteCalibration_requiredPipettesTitle`}
      >
        {t('required_pipettes_title')}
      </Text>
      <div>
        {PipetteConstants.PIPETTE_MOUNTS.map((mount, index) => {
          const pipetteInfo = currentRunPipetteInfoByMount[mount]
          return pipetteInfo != null ? (
            <PipetteCalibration
              key={index}
              pipetteInfo={pipetteInfo}
              index={index}
              mount={mount}
              robotName={robotName}
            />
          ) : null
        })}
      </div>
      <Divider marginY={SPACING_3} />
      <Text
        as="h2"
        css={FONT_HEADER_THIN}
        id={'TipRackCalibration_requiredTipLengthTitle'}
      >
        {t('required_tip_racks_title')}
      </Text>
      <div>
        {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
          const pipetteInfo = currentRunPipetteInfoByMount[mount]
          if (pipetteInfo == null) {
            return null
          } else {
            return (
              <div key={mount}>
                <Text
                  as="h4"
                  paddingY={SPACING_2}
                  fontWeight={FONT_WEIGHT_SEMIBOLD}
                >
                  {pipetteInfo.pipetteSpecs?.displayName}
                </Text>
                {pipetteInfo.tipRacksForPipette.map((tipRackInfo, index) => (
                  <CalibrationItem
                    key={index}
                    calibratedDate={tipRackInfo.lastModifiedDate}
                    index={index}
                    title={tipRackInfo.displayName}
                    button={
                      <TipLengthCalibration
                        mount={mount}
                        robotName={robotName}
                        hasCalibrated={tipRackInfo.lastModifiedDate !== null}
                        tipRackDefinition={tipRackInfo.tipRackDef}
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
      <Box textAlign={ALIGN_CENTER}>
        <PrimaryBtn
          disabled={!calibrationStatus.complete}
          onClick={() => expandStep(nextStep)}
          backgroundColor={C_BLUE}
          {...targetProps}
          id={'RobotCalStep_proceedButton'}
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
