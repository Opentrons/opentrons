import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RRDLink } from 'react-router-dom'
import {
  Text,
  Flex,
  Link,
  PrimaryBtn,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  C_BLUE,
} from '@opentrons/components'
import * as PipetteConstants from '../../../../redux/pipettes/constants'
import { INTENT_CALIBRATE_PIPETTE_OFFSET } from '../../../CalibrationPanels'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { CalibrationItem } from './CalibrationItem'

import type { ProtocolPipetteTipRackCalData } from '../../../../redux/pipettes/types'

const pipettesPageUrl = `/robots/opentrons-dev/instruments`
const inexactPipetteSupportArticle =
  'https://support.opentrons.com/en/articles/3450143-gen2-pipette-compatibility'

interface Props {
  pipetteTipRackData: ProtocolPipetteTipRackCalData
  index: number
  mount: string
  robotName: string
}

export function PipetteCalibration(props: Props): JSX.Element {
  const { pipetteTipRackData, index, mount, robotName } = props
  const { t } = useTranslation(['protocol_setup'])

  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })

  let calibrated = false
  let button
  let subText
  const attached =
    pipetteTipRackData.exactPipetteMatch === PipetteConstants.INEXACT_MATCH ||
    pipetteTipRackData.exactPipetteMatch === PipetteConstants.MATCH

  if (
    pipetteTipRackData.pipetteCalDate !== undefined &&
    pipetteTipRackData.pipetteCalDate !== null &&
    attached
  ) {
    calibrated = true
    if (
      pipetteTipRackData.exactPipetteMatch === PipetteConstants.INEXACT_MATCH
    ) {
      button = (
        <Flex flexDirection="row" alignItems="center">
          <Text
            fontSize={FONT_SIZE_BODY_1}
            fontStyle={FONT_STYLE_ITALIC}
            marginRight="2rem"
          >
            {t('pipette_mismatch')}
          </Text>
          <Link
            external
            fontSize={FONT_SIZE_BODY_1}
            href={inexactPipetteSupportArticle}
            marginRight="1rem"
          >
            {t('pipette_compat_help')}
          </Link>
        </Flex>
      )
    }
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
        <PrimaryBtn as={RRDLink} to={pipettesPageUrl} backgroundColor={C_BLUE}>
          {t('attach_pipette_cta')}
        </PrimaryBtn>
      </Flex>
    )
  } else {
    button = (
      <>
        <PrimaryBtn
          backgroundColor={C_BLUE}
          onClick={() =>
            startPipetteOffsetCalibration({
              withIntent: INTENT_CALIBRATE_PIPETTE_OFFSET,
            })
          }
        >
          {t('calibrate_now_cta')}
        </PrimaryBtn>
        {PipetteOffsetCalibrationWizard}
      </>
    )
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
