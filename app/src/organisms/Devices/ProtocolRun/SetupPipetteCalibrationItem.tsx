import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link as RRDLink } from 'react-router-dom'
import {
  Box,
  Flex,
  Tooltip,
  useHoverTooltip,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  SIZE_4,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  ALIGN_FLEX_START,
  Link,
  COLORS,
  SPACING,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { TertiaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { INTENT_CALIBRATE_PIPETTE_OFFSET } from '../../../organisms/CalibrationPanels'
import { useCalibratePipetteOffset } from '../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import { getHasCalibrationBlock } from '../../../redux/config'
import { Banner } from '../../../atoms/Banner'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import { useDeckCalibrationData } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'

import type { PipetteInfo } from '../hooks'

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/s/article/GEN2-pipette-compatibility'
interface SetupPipetteCalibrationItemProps {
  pipetteInfo: PipetteInfo
  index: number
  mount: string
  robotName: string
  runId: string
}

export function SetupPipetteCalibrationItem({
  pipetteInfo,
  mount,
  robotName,
  runId,
}: SetupPipetteCalibrationItemProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'devices_landing'])
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)
  const configHasCalibrationBlock = useSelector(getHasCalibrationBlock)
  const deviceDetailsUrl = `/devices/${robotName}`

  const { isDeckCalibrated } = useDeckCalibrationData(robotName)

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

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
  let pipetteMismatchInfo

  const attached =
    pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH ||
    pipetteInfo.requestedPipetteMatch === PipetteConstants.MATCH

  const pipetteMismatch =
    pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH
  if (pipetteMismatch) {
    pipetteMismatchInfo = (
      <Flex>
        <Banner type="warning">
          <Flex
            justifyContent={JUSTIFY_CENTER}
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_FLEX_START}
          >
            <StyledText as="p"> {t('pipette_mismatch')}</StyledText>
            <Link
              external
              color={COLORS.darkBlack}
              css={TYPOGRAPHY.pRegular}
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              href={inexactPipetteSupportArticle}
              id="PipetteCalibration_pipetteMismatchHelpLink"
            >
              {t('learn_more')}
            </Link>
          </Flex>
        </Banner>
      </Flex>
    )
  }

  if (pipetteInfo.pipetteCalDate != null && attached) {
    button = pipetteMismatchInfo
  } else if (!attached) {
    subText = t('attach_pipette_calibration')
    button = (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <TertiaryButton
          as={RRDLink}
          to={deviceDetailsUrl}
          id="PipetteCalibration_attachPipetteButton"
        >
          {t('attach_pipette_cta')}
        </TertiaryButton>
      </Flex>
    )
  } else {
    button = (
      <>
        <Flex alignItems={ALIGN_CENTER}>
          <TertiaryButton
            onClick={() => startPipetteOffsetCalibrationBlockModal(null)}
            disabled={!isDeckCalibrated}
            id="PipetteCalibration_calibratePipetteButton"
            {...targetProps}
          >
            {t('calibrate_now_cta')}
          </TertiaryButton>
          {!isDeckCalibrated ? (
            <Tooltip {...tooltipProps}>
              <Box width={SIZE_4}>
                {t('calibrate_deck_to_proceed_to_pipette_calibration')}
              </Box>
            </Tooltip>
          ) : null}
        </Flex>
      </>
    )
  }

  return (
    <>
      <SetupCalibrationItem
        banner={pipetteMismatch ? pipetteMismatchInfo : undefined}
        button={button}
        calibratedDate={attached ? pipetteInfo.pipetteCalDate : null}
        subText={subText}
        label={t(`devices_landing:${mount}_mount`)}
        title={pipetteInfo.pipetteSpecs?.displayName}
        id={`PipetteCalibration_${mount}MountTitle`}
        runId={runId}
      />
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
