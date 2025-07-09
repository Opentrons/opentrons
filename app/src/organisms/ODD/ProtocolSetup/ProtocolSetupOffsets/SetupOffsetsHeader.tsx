import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Chip,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import {
  useApplyOffsets,
  useLPCAnalytics,
} from '/app/organisms/LabwarePositionCheck'
import {
  appliedOffsetsToRun,
  selectIsAnyNecessaryDefaultOffsetMissing,
} from '/app/redux/protocol-runs'
import { useUpdateClientLPC } from '/app/resources/client_data'

import type { ProtocolSetupOffsetsProps } from '/app/organisms/ODD/ProtocolSetup'

export function SetupOffsetsHeader({
  runId,
  setSetupScreen,
  isConfirmed,
}: ProtocolSetupOffsetsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const dispatch = useDispatch()
  const { reportApplyOffsets } = useLPCAnalytics({
    runId,
    robotType: FLEX_ROBOT_TYPE,
  })
  const isNecessaryDefaultOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )
  const { updateWithRunId } = useUpdateClientLPC()

  const { applyOffsets, isApplyingOffsets } = useApplyOffsets(runId)
  const onApplyOffsets = (): void => {
    void applyOffsets().then(() => {
      dispatch(appliedOffsetsToRun(runId))
      reportApplyOffsets()
      updateWithRunId(runId)
      setSetupScreen('prepare to run')
    })
  }

  return (
    <Flex css={CONTAINER_STYLE}>
      <ODDBackButton
        label={t('labware_offsets')}
        onClick={() => {
          setSetupScreen('prepare to run')
        }}
      />
      {isConfirmed ? (
        <Chip
          background
          iconName="ot-check"
          text={t('offsets_applied')}
          type="success"
        />
      ) : (
        <SmallButton
          buttonText={t('apply_offsets')}
          ariaDisabled={isNecessaryDefaultOffsetMissing}
          onClick={onApplyOffsets}
          buttonCategory="rounded"
          iconPlacement="startIcon"
          iconName={isApplyingOffsets ? 'ot-spinner' : null}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        />
      )}
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32} ${SPACING.spacing40};
`
