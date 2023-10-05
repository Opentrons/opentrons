import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@opentrons/components'

import { SUCCESS, FAILURE, PENDING } from '../../redux/robot-api'
import { ConfigForm } from './ConfigForm'
import { ConfigErrorBanner } from './ConfigErrorBanner'

import type {
  PipetteSettingsFieldsUpdate,
  PipetteSettingsFieldsMap,
} from '../../redux/pipettes/types'
import type { RequestState } from '../../redux/robot-api/types'

interface Props {
  closeModal: () => void
  updateRequest: RequestState | null
  updateSettings: (fields: PipetteSettingsFieldsUpdate) => void
  robotName: string
  formId: string
  settings: PipetteSettingsFieldsMap
}

export function ConfigurePipette(props: Props): JSX.Element {
  const { closeModal, updateRequest, updateSettings, formId, settings } = props
  const { t } = useTranslation('device_details')

  const groupLabels = [
    t('plunger_positions'),
    t('tip_pickup_drop'),
    t('power_force'),
  ]

  const updateError: string | null =
    updateRequest && updateRequest.status === FAILURE
      ? // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to type narrow
        updateRequest.error.message || t('an_error_occurred_while_updating')
      : null

  // when an in-progress request completes, close modal if response was ok
  React.useEffect(() => {
    if (updateRequest?.status === SUCCESS) {
      closeModal()
    }
  }, [updateRequest, closeModal])

  return (
    <Box zIndex={1}>
      {updateError && <ConfigErrorBanner message={updateError} />}
      <ConfigForm
        settings={settings}
        updateInProgress={updateRequest?.status === PENDING}
        updateSettings={updateSettings}
        groupLabels={groupLabels}
        formId={formId}
      />
    </Box>
  )
}
