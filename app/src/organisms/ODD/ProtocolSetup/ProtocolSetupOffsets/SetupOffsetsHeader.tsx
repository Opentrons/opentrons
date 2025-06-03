import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Chip,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import { useAddLabwareOffsetToRunMutation } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { useLPCAnalytics } from '/app/organisms/LabwarePositionCheck'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  appliedOffsetsToRun,
  selectIsAnyNecessaryDefaultOffsetMissing,
  selectLabwareOffsetsToAddToRun,
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
  const { makeSnackbar } = useToaster()
  const { reportApplyOffsets } = useLPCAnalytics({
    runId,
    robotType: FLEX_ROBOT_TYPE,
  })
  const { createLabwareOffset } = useAddLabwareOffsetToRunMutation()
  const isNecessaryDefaultOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )
  const lwOffsetsForRun = useSelector(selectLabwareOffsetsToAddToRun(runId))
  const { updateWithRunId } = useUpdateClientLPC()

  const [isApplyOffsets, setIsApplyingOffsets] = useState(false)

  const onApplyOffsets = (): void => {
    if (!isApplyOffsets) {
      if (isNecessaryDefaultOffsetMissing) {
        makeSnackbar(t('add_missing_labware_offsets') as string)
      } else if (lwOffsetsForRun == null) {
        makeSnackbar(t('no_offsets_found') as string)
      } else {
        setIsApplyingOffsets(true)
        Promise.all(
          lwOffsetsForRun.map(data => createLabwareOffset({ runId, data }))
        )
          .then(() => {
            dispatch(appliedOffsetsToRun(runId))
            reportApplyOffsets()
            updateWithRunId(runId)
            setSetupScreen('prepare to run')
          })
          .catch(() => {
            makeSnackbar(t('failed_to_apply_offsets') as string)
          })
          .finally(() => {
            setIsApplyingOffsets(false)
          })
      }
    }
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
          iconName={isApplyOffsets ? 'ot-spinner' : null}
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
