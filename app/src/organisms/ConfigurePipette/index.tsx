import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@opentrons/components'

import { ConfigForm } from './ConfigForm'
import { ConfigErrorBanner } from './ConfigErrorBanner'
import type {
  PipetteSettingsFieldsMap,
  UpdatePipetteSettingsData,
} from '@opentrons/api-client'

interface Props {
  closeModal: () => void
  updateSettings: (params: UpdatePipetteSettingsData) => void
  updateError: Error | null
  isUpdateLoading: boolean
  robotName: string
  formId: string
  settings: PipetteSettingsFieldsMap
}

export function ConfigurePipette(props: Props): JSX.Element {
  const {
    updateSettings,
    updateError,
    isUpdateLoading,
    formId,
    settings,
  } = props
  const { t } = useTranslation('device_details')

  const groupLabels = [
    t('plunger_positions'),
    t('tip_pickup_drop'),
    t('power_force'),
  ]

  return (
    <Box zIndex={1}>
      {updateError != null && (
        <ConfigErrorBanner message={updateError.message} />
      )}
      <ConfigForm
        settings={settings}
        updateInProgress={isUpdateLoading}
        updateSettings={updateSettings}
        groupLabels={groupLabels}
        formId={formId}
      />
    </Box>
  )
}
