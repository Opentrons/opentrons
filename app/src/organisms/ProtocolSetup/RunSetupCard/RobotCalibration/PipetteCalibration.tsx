import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link as RRDLink } from 'react-router-dom'
import {
  Text,
  Flex,
  Link,
  NewPrimaryBtn,
  SPACING_3,
  ALIGN_CENTER,
  DIRECTION_ROW,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  C_BLUE,
  DIRECTION_COLUMN,
  ALIGN_FLEX_END,
  Icon,
  SPACING_1,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import { AskForCalibrationBlockModal } from '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import * as Config from '../../../../redux/config'
import * as PipetteConstants from '../../../../redux/pipettes/constants'
import { INTENT_CALIBRATE_PIPETTE_OFFSET } from '../../../CalibrationPanels'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { CalibrationItem } from './CalibrationItem'

import type { PipetteInfo } from '../hooks/useCurrentRunPipetteInfoByMount'

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/en/articles/3450143-gen2-pipette-compatibility'

interface Props {
  pipetteInfo: PipetteInfo
  index: number
  mount: string
  robotName: string
}

export function PipetteCalibration(props: Props): JSX.Element {
  const { pipetteInfo, index, mount, robotName } = props
  const { t } = useTranslation('protocol_setup')
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)
  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const pipettesPageUrl = `/robots/${robotName}/instruments`

  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })

  const startPipetteOffsetCalibrationBlockModal = (
    hasBlockModalResponse: boolean | null
  ): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      startPipetteOffsetCalibration({
        overrideParams: {
          hasCalibrationBlock: Boolean(
            configHasCalibrationBlock ?? hasBlockModalResponse
          ),
        },
        withIntent: INTENT_CALIBRATE_PIPETTE_OFFSET,
      })
      setShowCalBlockModal(false)
    }
  }

  let button: JSX.Element | undefined
  let subText
  const attached =
    pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH ||
    pipetteInfo.requestedPipetteMatch === PipetteConstants.MATCH

  let pipetteMismatchInfo
  if (pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH) {
    pipetteMismatchInfo = (
      <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_FLEX_END}>
        <Text
          fontSize={FONT_SIZE_BODY_1}
          fontStyle={FONT_STYLE_ITALIC}
          marginRight={SPACING_3}
        >
          {t('pipette_mismatch')}
        </Text>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Link
            external
            fontSize={FONT_SIZE_BODY_1}
            href={inexactPipetteSupportArticle}
            color={C_BLUE}
            marginRight={SPACING_3}
            id={'PipetteCalibration_pipetteMismatchHelpLink'}
          >
            {t('pipette_compat_help')}
            <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
          </Link>
        </Flex>
      </Flex>
    )
  }

  if (pipetteInfo.pipetteCalDate != null && attached) {
    button = pipetteMismatchInfo
  } else if (!attached) {
    subText = t('attach_pipette_calibration')
    button = (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Text
          fontSize={FONT_SIZE_BODY_1}
          fontStyle={FONT_STYLE_ITALIC}
          marginRight={SPACING_3}
        >
          {t('pipette_missing')}
        </Text>
        <NewPrimaryBtn
          as={RRDLink}
          to={pipettesPageUrl}
          id={'PipetteCalibration_attachPipetteButton'}
        >
          {t('attach_pipette_cta')}
        </NewPrimaryBtn>
      </Flex>
    )
  } else {
    button = (
      <>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          {pipetteMismatchInfo}
          <NewPrimaryBtn
            backgroundColor={C_BLUE}
            onClick={() => startPipetteOffsetCalibrationBlockModal(null)}
            id={'PipetteCalibration_calibratePipetteButton'}
          >
            {t('calibrate_now_cta')}
          </NewPrimaryBtn>
        </Flex>
        {PipetteOffsetCalibrationWizard}
        {showCalBlockModal && (
          <Portal level="top">
            <AskForCalibrationBlockModal
              onResponse={hasBlockModalResponse => {
                startPipetteOffsetCalibrationBlockModal(hasBlockModalResponse)
              }}
              titleBarTitle={t('pipette_offset_cal')}
              closePrompt={() => setShowCalBlockModal(false)}
            />
          </Portal>
        )}
      </>
    )
  }

  return (
    <CalibrationItem
      button={button}
      calibratedDate={attached ? pipetteInfo.pipetteCalDate : null}
      index={index}
      subText={subText}
      title={`${t('mount_title', { mount: mount.toUpperCase() })} ${
        pipetteInfo.pipetteSpecs?.displayName
      }`}
      id={`PipetteCalibration_${mount}MountTitle`}
    />
  )
}
