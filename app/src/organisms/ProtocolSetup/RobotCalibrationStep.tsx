import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Text, SPACING_3 } from '@opentrons/components'

import type { Dispatch, State } from '../../redux/types'
import type { ViewableRobot } from '../../redux/discovery/types'
import * as PipetteOffset from '../../redux/calibration/pipette-offset'
import * as Pipettes from '../../redux/pipettes'
import * as PipetteConstants from '../../redux/pipettes/constants'
import * as TipLength from '../../redux/calibration/tip-length'
import { DeckCalibration } from './DeckCalibration'
import { formatLastModified } from '../../organisms/CalibrationPanels/utils'

interface Props {
  robot: ViewableRobot
}

export const RobotCalibrationStep: React.FunctionComponent<Props> = (
  props: Props
) => {
  const { robot } = props
  const { name: robotName, status } = robot

  const dispatch = useDispatch<Dispatch>()
  React.useEffect(() => {
    robotName && dispatch(Pipettes.fetchPipettes(robotName))
    robotName &&
      dispatch(PipetteOffset.fetchPipetteOffsetCalibrations(robotName))
    robotName && dispatch(TipLength.fetchTipLengthCalibrations(robotName))
  }, [dispatch, robotName, status])

  const protocolPipetteData = Object.entries(
    useSelector((state: State) => {
      return Pipettes.getProtocolPipetteCalibrationInfo(state, robotName)
    })
  )

  return (
    <>
      <DeckCalibration robotName={robotName} />
      <Text marginTop={SPACING_3}>Required Pipettes</Text>
      <div>
        {protocolPipetteData.map(protocolPipette => {
          const mount = protocolPipette[0]
          const pipetteData = protocolPipette[1]

          if (pipetteData == null) {
            return null
          } else {
            const attached =
              pipetteData.exactMatch === PipetteConstants.INEXACT_MATCH ||
              pipetteData.exactMatch === PipetteConstants.MATCH

            return (
              <div key={pipetteData.lastModified}>
                <span>
                  {mount} Mount: {pipetteData.pipetteDisplayName}
                </span>
                {attached ? (
                  <div>
                    Last Calibrated:{' '}
                    {formatLastModified(pipetteData.lastModified)}
                  </div>
                ) : (
                  <div>Please attach and calibrate pipette</div>
                )}
              </div>
            )
          }
        })}
      </div>
      <Text marginTop={SPACING_3}>Required Tip Length Calibration</Text>
      <div>
        {protocolPipetteData.map(protocolPipette => {
          const pipetteData = protocolPipette[1]

          if (pipetteData == null) {
            return null
          } else {
            return (
              <div key={pipetteData.pipetteDisplayName}>
                <span>{pipetteData.pipetteDisplayName}</span>
                {pipetteData.tipRacks.map(tiprack => (
                  <>
                    <div key={tiprack.displayName}>{tiprack.displayName}</div>
                    {tiprack.lastModifiedDate !== null ? (
                      <span>
                        Last Calibrated:{' '}
                        {formatLastModified(tiprack.lastModified)}
                      </span>
                    ) : (
                      <span>Calibrate tiprack</span>
                    )}
                  </>
                ))}
              </div>
            )
          }
        })}
      </div>
    </>
  )
}
