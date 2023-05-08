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
  COLORS,
  SPACING,
  JUSTIFY_FLEX_END,
  WRAP,
} from '@opentrons/components'

import { TertiaryButton } from '../../../atoms/buttons'
import { Banner } from '../../../atoms/Banner'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { useDeckCalibrationData, useIsOT3 } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'

import type { Mount } from '../../../redux/pipettes/types'
import type { PipetteInfo } from '../hooks'

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/s/article/GEN2-pipette-compatibility'
interface SetupPipetteCalibrationItemProps {
  pipetteInfo: PipetteInfo
  index: number
  mount: Mount
  robotName: string
  runId: string
}

export function SetupPipetteCalibrationItem({
  pipetteInfo,
  mount,
  robotName,
  runId,
}: SetupPipetteCalibrationItemProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'devices_landing'])
  const deviceDetailsUrl = `/devices/${robotName}`
  const [showFlexPipetteFlow, setShowFlexPipetteFlow] = React.useState(false)
  const { isDeckCalibrated } = useDeckCalibrationData(robotName)
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const isOT3 = useIsOT3(robotName)

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  let button: JSX.Element | undefined
  let subText
  let pipetteMismatchInfo

  if (pipetteInfo == null) return null

  const attached =
    pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH ||
    pipetteInfo.requestedPipetteMatch === PipetteConstants.MATCH

  if (pipetteInfo.requestedPipetteMatch === PipetteConstants.INEXACT_MATCH) {
    pipetteMismatchInfo = (
      <Flex alignItems={ALIGN_CENTER}>
        <Banner type="warning" padding={SPACING.spacing2}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {t('pipette_mismatch')}
            <Link
              external
              color={COLORS.darkBlackEnabled}
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

  let flowType = ''
  if (pipetteInfo.pipetteCalDate != null && attached) {
    button = pipetteMismatchInfo
  } else if (!attached) {
    subText = t('attach_pipette_calibration')
    if (isOT3) {
      flowType = 'ATTACH'
      button = (
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <TertiaryButton
            id="PipetteCalibration_attachPipetteButton"
            onClick={() => setShowFlexPipetteFlow(true)}
          >
            {t('attach_pipette_cta')}
          </TertiaryButton>
        </Flex>
      )
    } else {
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
    }
  } else {
    flowType = 'CALIBRATE'
    button = (
      <>
        <Flex
          alignItems={ALIGN_CENTER}
          marginLeft={SPACING.spacing4}
          flexWrap={WRAP}
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing3}
        >
          <Flex>{pipetteMismatchInfo}</Flex>
          {isOT3 ? (
            <TertiaryButton
              disabled={!isDeckCalibrated}
              id="PipetteCalibration_calibratePipetteButton"
              {...targetProps}
              onClick={() => setShowFlexPipetteFlow(true)}
            >
              {t('calibrate_now_cta')}
            </TertiaryButton>
          ) : (
            <RRDLink
              to={`/devices/${robotName}/robot-settings/calibration/dashboard`}
            >
              <TertiaryButton
                disabled={!isDeckCalibrated}
                id="PipetteCalibration_calibratePipetteButton"
                {...targetProps}
              >
                {t('calibrate_now_cta')}
              </TertiaryButton>
            </RRDLink>
          )}
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

  const attachedCalibratedDate = pipetteInfo.pipetteCalDate

  return (
    <>
      {showFlexPipetteFlow && (
        <PipetteWizardFlows
          flowType={flowType}
          mount={mount}
          closeFlow={() => setShowFlexPipetteFlow(false)}
          selectedPipette={
            pipetteInfo.pipetteSpecs.channels === 96
              ? '96-Channel'
              : 'Single-Channel_and_8-Channel'
          }
          pipetteInfo={mostRecentAnalysis?.pipettes}
        />
      )}
      <SetupCalibrationItem
        button={button}
        calibratedDate={attached ? attachedCalibratedDate : null}
        subText={subText}
        label={t(`devices_landing:${mount}_mount`)}
        title={pipetteInfo.pipetteSpecs?.displayName}
        id={`PipetteCalibration_${mount}MountTitle`}
        runId={runId}
      />
    </>
  )
}
