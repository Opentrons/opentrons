import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Text, SPACING_3 } from '@opentrons/components'
import * as PipetteOffset from '../../../../redux/calibration/pipette-offset'
import * as Pipettes from '../../../../redux/pipettes'
import * as TipLength from '../../../../redux/calibration/tip-length'
import { formatLastModified } from '../../../CalibrationPanels/utils'
import * as PipetteConstants from '../../../../redux/pipettes/constants'
import { DeckCalibration } from './DeckCalibration'

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
      <Text marginTop={SPACING_3}>{t('required_pipettes_title')}</Text>
      <div>
        {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
          const pipetteTipRackData = protocolPipetteTipRackData[mount]
          if (pipetteTipRackData == null) {
            return null
          } else {
            const attached =
              pipetteTipRackData.exactPipetteMatch ===
                PipetteConstants.INEXACT_MATCH ||
              pipetteTipRackData.exactPipetteMatch === PipetteConstants.MATCH

            return (
              <div key={pipetteTipRackData.pipetteDisplayName}>
                <span>
                  {t('mount_title', { mount: mount })}
                  {pipetteTipRackData.pipetteDisplayName}
                </span>
                {attached &&
                pipetteTipRackData.pipetteCalDate !== undefined &&
                pipetteTipRackData.pipetteCalDate !== null ? (
                  <div>
                    {t('last_calibrated', {
                      date: formatLastModified(
                        pipetteTipRackData.pipetteCalDate
                      ),
                    })}
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
        {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
          const pipetteTipRackData = protocolPipetteTipRackData[mount]
          if (pipetteTipRackData == null) {
            return null
          } else {
            return (
              <div key={mount}>
                <span>{pipetteTipRackData.pipetteDisplayName}</span>
                {pipetteTipRackData.tipRacks.map(tipRack => (
                  <div key={tipRack.displayName}>
                    <div>{tipRack.displayName}</div>
                    {tipRack.lastModifiedDate !== null ? (
                      <span>
                        {t('last_calibrated', {
                          date: formatLastModified(tipRack.lastModifiedDate),
                        })}
                      </span>
                    ) : (
                      <span>{t('not_calibrated')}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        })}
      </div>
    </>
  )
}
