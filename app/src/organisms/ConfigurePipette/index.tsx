import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@opentrons/components'
import { usePipetteSettingsQuery } from '@opentrons/react-api-client'
import { SUCCESS, FAILURE, PENDING } from '../../redux/robot-api'
import { useFeatureFlag } from '../../redux/config'
import { ConfigForm } from './ConfigForm'
import { ConfigErrorBanner } from './ConfigErrorBanner'
import type {
  AttachedPipette,
  PipetteSettingsFieldsUpdate,
} from '../../redux/pipettes/types'
import type { RequestState } from '../../redux/robot-api/types'
import type { RefObject } from './ConfigForm'

const PIPETTE_SETTINGS_POLL_MS = 5000
interface ConfigurePipetteProps {
  closeModal: () => unknown
  pipetteId: AttachedPipette['id']
  updateRequest: RequestState | null
  updateSettings: (fields: PipetteSettingsFieldsUpdate) => void
  ref: React.Ref<RefObject>
}

export function ConfigurePipette(props: ConfigurePipetteProps): JSX.Element {
  const { closeModal, pipetteId, updateRequest, updateSettings, ref } = props
  const { t } = useTranslation('device_details')
  const settings = usePipetteSettingsQuery({
    refetchInterval: PIPETTE_SETTINGS_POLL_MS,
  })?.data
  const groupLabels = [
    t('plunger_positions'),
    t('tip_pickup_drop'),
    t('for_dev_use_only'),
    t('power_force'),
  ]

  const updateError: string | null =
    updateRequest && updateRequest.status === FAILURE
      ? // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to type narrow
        updateRequest.error.message || t('an_error_occurred_while_updating')
      : null

  // TODO(mc, 2019-12-09): remove this feature flag
  const __showHiddenFields = useFeatureFlag('allPipetteConfig')

  // when an in-progress request completes, close modal if response was ok
  React.useEffect(() => {
    if (updateRequest?.status === SUCCESS) {
      closeModal()
    }
  }, [updateRequest, closeModal])

  return (
    <Box zIndex={1}>
      {updateError && <ConfigErrorBanner message={updateError} />}
      {settings != null && pipetteId != null && (
        <ConfigForm
          //  @ts-expect-error: pipetteId and settings should not be undefined
          settings={settings[pipetteId].fields}
          updateInProgress={updateRequest?.status === PENDING}
          updateSettings={updateSettings}
          groupLabels={groupLabels}
          __showHiddenFields={__showHiddenFields}
          ref={ref}
        />
      )}
    </Box>
  )
}
