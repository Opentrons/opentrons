import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link as RRDLink } from 'react-router-dom'
import {
  Text,
  Flex,
  SPACING_3,
  FONT_WEIGHT_BOLD,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  FONT_HEADER_THIN,
  PrimaryBtn,
  C_BLUE,
} from '@opentrons/components'
import * as PipetteOffset from '../../../../redux/calibration/pipette-offset'
import * as Pipettes from '../../../../redux/pipettes'
import * as TipLength from '../../../../redux/calibration/tip-length'
import * as PipetteConstants from '../../../../redux/pipettes/constants'
import { formatLastModified } from '../../../CalibrationPanels/utils'
import { DeckCalibration } from './DeckCalibration'
import { CalibrationItem } from './CalibrationItem'

import type { Dispatch, State } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'

const pipettesPageUrl = `/robots/opentrons-dev/instruments`

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
            let calibrated = false
            let button
            let subText
            const attached =
              pipetteTipRackData.exactPipetteMatch ===
                PipetteConstants.INEXACT_MATCH ||
              pipetteTipRackData.exactPipetteMatch === PipetteConstants.MATCH

            if (
              pipetteTipRackData.pipetteCalDate !== undefined &&
              pipetteTipRackData.pipetteCalDate !== null &&
              attached
            ) {
              calibrated = true
            } else if (!attached) {
              subText = t('attach_pipette_calibration')
              button = (
                <Flex flexDirection="row" alignItems="center">
                  <Text
                    fontSize={FONT_SIZE_BODY_1}
                    fontStyle={FONT_STYLE_ITALIC}
                    marginRight="2rem"
                  >
                    {t('pipette_missing')}
                  </Text>
                  <PrimaryBtn
                    as={RRDLink}
                    to={pipettesPageUrl}
                    backgroundColor={C_BLUE}
                  >
                    {t('attach_pipette_cta')}
                  </PrimaryBtn>
                </Flex>
              )
            } else {
              subText = t('not_calibrated')
            }

            return (
              <CalibrationItem
                button={button}
                calibrated={calibrated}
                calibratedDate={pipetteTipRackData.pipetteCalDate}
                index={index}
                subText={subText}
                title={`${t('mount_title', { mount: mount.toUpperCase() })} ${
                  pipetteTipRackData.pipetteDisplayName
                }`}
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
