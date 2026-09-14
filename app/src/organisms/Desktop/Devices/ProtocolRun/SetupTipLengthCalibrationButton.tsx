import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  LegacyTooltip,
  Link,
  SIZE_4,
  TEXT_ALIGN_CENTER,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useDeleteCalibrationMutation,
} from '@opentrons/react-api-client'
import { getLabwareDefURI } from '@opentrons/shared-data'

import { TertiaryButton } from '/app/atoms/buttons'
// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import { useDashboardCalibrateTipLength } from '/app/pages/Desktop/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import { useAttachedPipettes } from '/app/resources/instruments'
import { useRunHasStarted } from '/app/resources/runs'

import { useDeckCalibrationData } from '../hooks'

import type { ReactNode } from 'react'
import type { Mount } from '@opentrons/components'
import type { LabwareDefinition } from '@opentrons/shared-data'

export interface SetupTipLengthCalibrationButtonProps {
  robotName: string
  runId: string
  hasCalibrated: boolean
  mount: Mount
  tipRackDefinition: LabwareDefinition
  isExtendedPipOffset: boolean
  disabled: boolean
}

export function SetupTipLengthCalibrationButton({
  robotName,
  runId,
  hasCalibrated,
  mount,
  tipRackDefinition,
  isExtendedPipOffset,
  disabled,
}: SetupTipLengthCalibrationButtonProps): ReactNode {
  const { t } = useTranslation(['protocol_setup', 'shared'])

  const { isDeckCalibrated } = useDeckCalibrationData(robotName)
  const [tipLengthCalLauncher, TipLengthCalWizard] =
    useDashboardCalibrateTipLength(robotName)
  const { deleteCalibration } = useDeleteCalibrationMutation()
  const attachedPipettes = useAttachedPipettes()
  const offsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery()?.data?.data ?? []
  const offsetCalsToDelete = offsetCalibrations?.filter(
    cal =>
      cal.pipette === attachedPipettes[mount]?.id &&
      cal.tiprackUri === getLabwareDefURI(tipRackDefinition)
  )

  const invalidateHandler = (): void => {
    if (offsetCalsToDelete !== undefined) {
      for (const cal of offsetCalsToDelete) {
        deleteCalibration({
          calType: 'pipetteOffset',
          mount: cal.mount,
          pipette_id: cal.pipette,
        })
      }
    }
  }

  const runHasStarted = useRunHasStarted(runId)
  const disableRecalibrate = runHasStarted || !isDeckCalibrated

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const recalibrateLink = disableRecalibrate ? (
    <>
      <Box
        color={COLORS.grey40}
        css={TYPOGRAPHY.labelSemiBold}
        {...targetProps}
      >
        {t('recalibrate')}
      </Box>
      <LegacyTooltip {...tooltipProps}>
        {
          <Box width={SIZE_4} textAlign={TEXT_ALIGN_CENTER}>
            {isDeckCalibrated
              ? t('recalibrating_tip_length_not_available')
              : t('calibrate_deck_to_proceed_to_tip_length_calibration')}
          </Box>
        }
      </LegacyTooltip>
    </>
  ) : (
    <Link
      role="link"
      onClick={() => {
        tipLengthCalLauncher({
          params: { mount, tipRackDefinition },
          hasBlockModalResponse: null,
          invalidateHandler:
            offsetCalsToDelete !== undefined ? invalidateHandler : undefined,
        })
      }}
      css={TYPOGRAPHY.labelSemiBold}
    >
      {t('recalibrate')}
    </Link>
  )

  return (
    <>
      <Flex alignItems={ALIGN_CENTER}>
        {hasCalibrated ? (
          recalibrateLink
        ) : (
          <>
            <TertiaryButton
              onClick={() => {
                tipLengthCalLauncher({
                  params: { mount, tipRackDefinition },
                  hasBlockModalResponse: null,
                })
              }}
              disabled={disabled || !isDeckCalibrated}
              {...targetProps}
            >
              {t('calibrate_now')}
            </TertiaryButton>
            {!isDeckCalibrated ? (
              <LegacyTooltip {...tooltipProps}>
                {
                  <Box width={SIZE_4}>
                    {t('calibrate_deck_to_proceed_to_tip_length_calibration')}
                  </Box>
                }
              </LegacyTooltip>
            ) : null}
          </>
        )}
      </Flex>
      {TipLengthCalWizard}
    </>
  )
}
