import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'

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

export function RobotCalibrationStep(props: Props): JSX.Element {
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

  const protocolPipetteData = useSelector((state: State) => {
    return Pipettes.getProtocolPipetteCalibrationInfo(state, robotName)
  })
  console.log(protocolPipetteData)
  return (
    <>
      <DeckCalibration robotName={robotName} />
      <Text marginTop={SPACING_3}>{t('required_pipettes_title')}</Text>
      <div>
        {Object.entries(protocolPipetteData).map(([mount, pipetteData]) => {
          if (pipetteData == null) {
            return null
          } else {
            const attached =
              pipetteData.exactMatch === PipetteConstants.INEXACT_MATCH ||
              pipetteData.exactMatch === PipetteConstants.MATCH

            return (
              <div key={pipetteData.lastModified}>
                <span>
                  {mount}
                  {` ${t('mount_title')}: `}
                  {pipetteData.pipetteDisplayName}
                </span>
                {attached && pipetteData.lastModifiedDate !== null ? (
                  <div>
                    {`${t('last_calibrated')} `}
                    {formatLastModified(pipetteData.lastModifiedDate)}
                  </div>
                ) : (
                  <div>{t('not_calibrated')}</div>
                )}
              </div>
            )
          }
        })}
      </div>
      <Text marginTop={SPACING_3}>{t('required_tip_racks_title')}</Text>
      <div>
        {Object.entries(protocolPipetteData).map(([mount, pipetteData]) => {
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
                        {`${t('last_calibrated')} `}
                        {formatLastModified(tiprack.lastModifiedDate)}
                      </span>
                    ) : (
                      <span>{t('not_calibrated')}</span>
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
