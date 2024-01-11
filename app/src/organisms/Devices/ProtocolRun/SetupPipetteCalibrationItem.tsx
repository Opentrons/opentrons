import * as React from 'react'
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
  SIZE_4,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  Link,
  LEGACY_COLORS,
  SPACING,
  JUSTIFY_FLEX_END,
  WRAP,
} from '@opentrons/components'
import { TertiaryButton } from '../../../atoms/buttons'
import { Banner } from '../../../atoms/Banner'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import { useDeckCalibrationData } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'

import type { Mount } from '../../../redux/pipettes/types'
import type { PipetteInfo } from '../hooks'

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/s/article/GEN2-pipette-compatibility'
interface SetupInstrumentCalibrationItemProps {
  pipetteInfo: PipetteInfo
  mount: Mount
  robotName: string
  runId: string
  instrumentsRefetch?: () => void
}

export function SetupPipetteCalibrationItem({
  pipetteInfo,
  mount,
  robotName,
  runId,
}: SetupInstrumentCalibrationItemProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'devices_landing'])
  const deviceDetailsUrl = `/devices/${robotName}`
  const { isDeckCalibrated } = useDeckCalibrationData(robotName)

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  let button: JSX.Element | undefined
  let subText
  let pipetteMismatchInfo

  if (pipetteInfo == null) return null
  const pipetteCalDate = pipetteInfo.pipetteCalDate

  const attached =
    pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH ||
    pipetteInfo.requestedPipetteMatch === PipetteConstants.MATCH

  if (pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH) {
    pipetteMismatchInfo = (
      <Flex alignItems={ALIGN_CENTER}>
        <Banner type="warning" padding={SPACING.spacing4}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {t('pipette_mismatch')}
            <Link
              external
              color={LEGACY_COLORS.darkBlackEnabled}
              fontSize={TYPOGRAPHY.fontSizeP}
              lineHeight={TYPOGRAPHY.lineHeight12}
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

  if (pipetteCalDate != null && attached) {
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
        <Flex
          alignItems={ALIGN_CENTER}
          marginLeft={SPACING.spacing16}
          flexWrap={WRAP}
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          <Flex>{pipetteMismatchInfo}</Flex>
          <RRDLink
            to={`/devices/${robotName}/robot-settings/calibration/dashboard`}
          >
            <TertiaryButton
              disabled={!isDeckCalibrated}
              id="PipetteCalibration_calibratePipetteButton"
              {...targetProps}
            >
              {t('calibrate_now')}
            </TertiaryButton>
          </RRDLink>
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

  const attachedCalibratedDate = pipetteCalDate ?? null

  return (
    <SetupCalibrationItem
      button={button}
      calibratedDate={attached ? attachedCalibratedDate : null}
      subText={subText}
      label={t(`devices_landing:${mount}_mount`)}
      title={pipetteInfo.pipetteSpecs?.displayName}
      id={`PipetteCalibration_${mount}MountTitle`}
      runId={runId}
    />
  )
}
