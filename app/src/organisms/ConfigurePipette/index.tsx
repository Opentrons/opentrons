import { getAttachedPipetteSettingsFieldsById } from '../../redux/pipettes'
import type {
  AttachedPipette,
  PipetteSettingsFieldsUpdate,
} from '../../redux/pipettes/types'
import { SUCCESS, FAILURE, PENDING } from '../../redux/robot-api'
import type { RequestState } from '../../redux/robot-api/types'
import type { State } from '../../redux/types'
import { ConfigErrorBanner } from './ConfigErrorBanner'
import { ConfigForm } from './ConfigForm'
import { Box } from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

interface Props {
  closeModal: () => void
  pipetteId: AttachedPipette['id']
  updateRequest: RequestState | null
  updateSettings: (fields: PipetteSettingsFieldsUpdate) => void
  robotName: string
  formId: string
}

export function ConfigurePipette(props: Props): JSX.Element {
  const {
    closeModal,
    pipetteId,
    updateRequest,
    updateSettings,
    robotName,
    formId,
  } = props
  const { t } = useTranslation('device_details')

  const settings = useSelector((state: State) =>
    getAttachedPipetteSettingsFieldsById(state, robotName, pipetteId)
  )
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
      {settings != null && pipetteId != null && (
        <ConfigForm
          settings={settings}
          updateInProgress={updateRequest?.status === PENDING}
          updateSettings={updateSettings}
          groupLabels={groupLabels}
          formId={formId}
        />
      )}
    </Box>
  )
}
