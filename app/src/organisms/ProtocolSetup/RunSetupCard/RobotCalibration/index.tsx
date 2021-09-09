import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Text,
  SPACING_3,
  FONT_WEIGHT_BOLD,
  FONT_HEADER_THIN,
} from '@opentrons/components'
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

interface Props {
  robot: ViewableRobot
}

export function RobotCalibration(props: Props): JSX.Element {
  const { robot } = props
  const { name: robotName, status } = robot
  const { t } = useTranslation(['protocol_setup'])

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
      <Text marginTop={SPACING_3} css={FONT_HEADER_THIN}>
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
      <Text marginTop={SPACING_3} css={FONT_HEADER_THIN}>
        {t('required_tip_racks_title')}
      </Text>
      <div>
        {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
          const pipetteTipRackData = protocolPipetteTipRackData[mount]
          if (pipetteTipRackData == null) {
            return null
          } else {
            return (
              <div key={mount}>
                <Text fontWeight={FONT_WEIGHT_BOLD}>
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
    </>
  )
}
