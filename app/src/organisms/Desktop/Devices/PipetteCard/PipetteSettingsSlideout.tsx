import { useTranslation } from 'react-i18next'
import { Flex } from '@opentrons/components'
import { useUpdatePipetteSettingsMutation } from '@opentrons/react-api-client'
import { Slideout } from '/app/atoms/Slideout'
import { ConfigFormSubmitButton } from '../ConfigurePipette/ConfigFormSubmitButton'
import { ConfigurePipette } from '../ConfigurePipette'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { PipetteSettingsFieldsMap } from '@opentrons/api-client'
import type { AttachedPipette } from '/app/redux/pipettes/types'

interface PipetteSettingsSlideoutProps {
  robotName: string
  pipetteName: PipetteModelSpecs['displayName']
  onCloseClick: () => void
  isExpanded: boolean
  pipetteId: AttachedPipette['id']
  settings: PipetteSettingsFieldsMap
}

export const PipetteSettingsSlideout = (
  props: PipetteSettingsSlideoutProps
): JSX.Element | null => {
  const {
    pipetteName,
    robotName,
    isExpanded,
    pipetteId,
    onCloseClick,
    settings,
  } = props
  const { t } = useTranslation('device_details')
  const {
    updatePipetteSettings,
    isLoading,
    error,
  } = useUpdatePipetteSettingsMutation(pipetteId, { onSuccess: onCloseClick })

  const FORM_ID = `configurePipetteForm_${pipetteId}`

  return (
    <Slideout
      title={t('pipette_settings', { pipetteName: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={<ConfigFormSubmitButton disabled={isLoading} formId={FORM_ID} />}
    >
      <Flex data-testid={`PipetteSettingsSlideout_${robotName}_${pipetteId}`}>
        <ConfigurePipette
          closeModal={onCloseClick}
          updateSettings={updatePipetteSettings}
          updateError={error}
          isUpdateLoading={isLoading}
          robotName={robotName}
          formId={FORM_ID}
          settings={settings}
        />
      </Flex>
    </Slideout>
  )
}
