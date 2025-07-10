import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useAddLabwareOffsetToRunMutation } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useLPCAnalytics } from '/app/organisms/LabwarePositionCheck'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  selectIsAnyNecessaryDefaultOffsetMissing,
  selectLabwareOffsetsToAddToRun,
} from '/app/redux/protocol-runs'

interface ApplyOffsetsResult {
  applyOffsets: () => Promise<void>
  isApplyingOffsets: boolean
}

export function useApplyOffsets(runId: string): ApplyOffsetsResult {
  const { t } = useTranslation('protocol_setup')
  const lwOffsetsForRun = useSelector(selectLabwareOffsetsToAddToRun(runId))
  const isNecessaryDefaultOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )
  const { makeSnackbar } = useToaster()
  const { createLabwareOffset } = useAddLabwareOffsetToRunMutation()
  const { reportApplyOffsets } = useLPCAnalytics({
    runId,
    robotType: FLEX_ROBOT_TYPE,
  })
  const [isApplyingOffsets, setIsApplyingOffsets] = useState(false)

  const applyOffsets = (): Promise<void> => {
    if (isApplyingOffsets) {
      return Promise.resolve()
    } else if (isNecessaryDefaultOffsetMissing) {
      makeSnackbar(t('add_missing_labware_offsets') as string)
      return Promise.reject(new Error('Missing necessary default offsets'))
    } else if (lwOffsetsForRun == null) {
      makeSnackbar(t('no_offsets_found') as string)
      return Promise.reject(new Error('No offsets found'))
    } else {
      setIsApplyingOffsets(true)
      return Promise.all(
        lwOffsetsForRun.map(data => createLabwareOffset({ runId, data }))
      )
        .then(() => {
          reportApplyOffsets()
        })
        .catch(error => {
          makeSnackbar(t('failed_to_apply_offsets') as string)
          throw error // Re-throw to allow chaining
        })
        .finally(() => {
          setIsApplyingOffsets(false)
        })
        .then(() => {})
    }
  }

  return { applyOffsets, isApplyingOffsets }
}
