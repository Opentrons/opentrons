import * as React from 'react'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import { useSelector } from 'react-redux'
import { Flex } from '@opentrons/components'
import { PipetteModelSpecs } from '@opentrons/shared-data'
import { updatePipetteSettings } from '../../../redux/pipettes'
import { Slideout } from '../../../atoms/Slideout'
import {
  getRequestById,
  PENDING,
  useDispatchApiRequest,
} from '../../../redux/robot-api'
import { ConfigFormSubmitButton } from '../../ConfigurePipette/ConfigFormSubmitButton'
import { ConfigurePipette } from '../../ConfigurePipette'

import type {
  AttachedPipette,
  PipetteSettingsFieldsUpdate,
  PipetteSettingsFieldsMap,
} from '../../../redux/pipettes/types'
import type { State } from '../../../redux/types'
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
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const updateSettings = (fields: PipetteSettingsFieldsUpdate): void => {
    dispatchRequest(updatePipetteSettings(robotName, pipetteId, fields))
  }
  const latestRequestId = last(requestIds)
  const updateRequest = useSelector((state: State) =>
    latestRequestId != null ? getRequestById(state, latestRequestId) : null
  )
  const FORM_ID = `configurePipetteForm_${pipetteId}`

  return (
    <Slideout
      title={t('pipette_settings', { pipetteName: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <ConfigFormSubmitButton
          disabled={updateRequest?.status === PENDING}
          formId={FORM_ID}
        />
      }
    >
      <Flex data-testid={`PipetteSettingsSlideout_${robotName}_${pipetteId}`}>
        <ConfigurePipette
          closeModal={onCloseClick}
          updateRequest={updateRequest}
          updateSettings={updateSettings}
          robotName={robotName}
          formId={FORM_ID}
          settings={settings}
        />
      </Flex>
    </Slideout>
  )
}
