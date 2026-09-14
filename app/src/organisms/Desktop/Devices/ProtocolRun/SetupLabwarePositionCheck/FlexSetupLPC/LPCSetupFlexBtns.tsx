import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Flex,
  JUSTIFY_CENTER,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  Tooltip,
  TOOLTIP_BOTTOM,
  useHoverTooltip,
} from '@opentrons/components'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useApplyOffsets } from '/app/organisms/LabwarePositionCheck/LPCFlows'
import {
  selectIsAnyNecessaryDefaultOffsetMissing,
  selectTotalCountNonHardCodedLSOffsets,
} from '/app/redux/protocol-runs'
import { useLPCDisabledReason } from '/app/resources/runs'

import type { ReactNode } from 'react'
import type { SetupLabwarePositionCheckProps } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupLabwarePositionCheck'

export interface LPCSetupFlexBtnsProps extends SetupLabwarePositionCheckProps {
  launchLPC: () => void
}

export function LPCSetupFlexBtns({
  setOffsetsConfirmed,
  offsetsConfirmed,
  launchLPC,
  runId,
  robotName,
  hasMissingModulesForFlex,
  hasMissingCalForFlex,
}: LPCSetupFlexBtnsProps): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const lpcDisabledReason = useLPCDisabledReason({
    robotName,
    runId,
    hasMissingCalForFlex: hasMissingCalForFlex,
    hasMissingModulesForFlex: hasMissingModulesForFlex,
  })
  const isNecessaryDefaultOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )
  const [runLPCTargetProps, runLPCTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
  })
  const [confirmOffsetsTargetProps, confirmOffsetsTooltipProps] =
    useHoverTooltip({
      placement: TOOLTIP_BOTTOM,
    })

  const anyOffsetsToLpc =
    useSelector(selectTotalCountNonHardCodedLSOffsets(runId)) === 0

  const isApplyOffsetsBtnDisabled =
    offsetsConfirmed ||
    isNecessaryDefaultOffsetMissing ||
    lpcDisabledReason !== null
  const applyOffsetsDisabledTooltipText = (): string | null => {
    if (lpcDisabledReason != null) {
      return lpcDisabledReason
    } else if (isNecessaryDefaultOffsetMissing) {
      return t('add_missing_labware_offsets')
    } else if (offsetsConfirmed) {
      return t('offsets_already_applied')
    } else if (lpcDisabledReason != null) {
      return lpcDisabledReason
    } else if (!anyOffsetsToLpc) {
      return t('no_offsets_found')
    } else {
      return null
    }
  }

  const runLPCDisabledTooltipText = (): string | null => {
    if (lpcDisabledReason != null) {
      return lpcDisabledReason
    } else if (offsetsConfirmed) {
      return t('offsets_already_applied')
    } else {
      return null
    }
  }

  const documentationState = useDocumentationState()
  const { applyOffsets } = useApplyOffsets(runId, documentationState)
  const onApplyOffsets = (): void => {
    void applyOffsets().then(() => {
      setOffsetsConfirmed(true)
    })
  }

  return (
    <Flex justifyContent={JUSTIFY_CENTER} gridGap={SPACING.spacing8}>
      <SecondaryButton
        onClick={launchLPC}
        {...runLPCTargetProps}
        disabled={lpcDisabledReason !== null || offsetsConfirmed}
      >
        {t('run_labware_position_check')}
      </SecondaryButton>
      {lpcDisabledReason !== null || offsetsConfirmed ? (
        <Tooltip tooltipProps={runLPCTooltipProps}>
          {runLPCDisabledTooltipText()}
        </Tooltip>
      ) : null}
      <PrimaryButton
        onClick={onApplyOffsets}
        padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
        disabled={isApplyOffsetsBtnDisabled}
        {...confirmOffsetsTargetProps}
      >
        {t('apply_offsets')}
      </PrimaryButton>
      {isApplyOffsetsBtnDisabled ? (
        <Tooltip tooltipProps={confirmOffsetsTooltipProps}>
          {applyOffsetsDisabledTooltipText()}
        </Tooltip>
      ) : null}
    </Flex>
  )
}
