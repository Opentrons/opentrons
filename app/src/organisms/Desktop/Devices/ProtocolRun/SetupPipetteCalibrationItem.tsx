import { useTranslation } from 'react-i18next'
import { Link as RRDLink } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Banner,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyTooltip,
  Link,
  SIZE_4,
  SPACING,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  useHoverTooltip,
  WRAP,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { INEXACT_MATCH, MATCH } from '/app/resources/runs/constants'

import { useDeckCalibrationData } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'

import type { Mount } from '@opentrons/api-client'
import type { PipetteInfo } from '/app/resources/runs/types'

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
    pipetteInfo.requestedPipetteMatch === INEXACT_MATCH ||
    pipetteInfo.requestedPipetteMatch === MATCH

  if (pipetteInfo.requestedPipetteMatch === INEXACT_MATCH) {
    pipetteMismatchInfo = (
      <Flex alignItems={ALIGN_CENTER}>
        <Banner type="warning" padding={SPACING.spacing4}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {t('pipette_mismatch')}
            <Link
              external
              color={COLORS.black90}
              fontSize={TYPOGRAPHY.fontSizeP}
              lineHeight={TYPOGRAPHY.lineHeight12}
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              href={inexactPipetteSupportArticle}
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
        <RRDLink to={deviceDetailsUrl}>
          <TertiaryButton>
            {t('attach_pipette_cta')}
          </TertiaryButton>
        </RRDLink>
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
              {...targetProps}
            >
              {t('calibrate_now')}
            </TertiaryButton>
          </RRDLink>
          {!isDeckCalibrated ? (
            <LegacyTooltip {...tooltipProps}>
              <Box width={SIZE_4}>
                {t('calibrate_deck_to_proceed_to_pipette_calibration')}
              </Box>
            </LegacyTooltip>
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
      runId={runId}
    />
  )
}
