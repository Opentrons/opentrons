import * as React from 'react'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, useInterval, POSITION_ABSOLUTE } from '@opentrons/components'
import { PipetteModelSpecs } from '@opentrons/shared-data'
import {
  fetchPipetteSettings,
  updatePipetteSettings,
} from '../../../redux/pipettes'
import { Slideout } from '../../../atoms/Slideout'
import { Numpad } from '../../../atoms/SoftwareKeyboard'
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
} from '../../../redux/pipettes/types'
import type { Dispatch, State } from '../../../redux/types'

const FETCH_PIPETTES_INTERVAL_MS = 5000

interface PipetteSettingsSlideoutProps {
  robotName: string
  pipetteName: PipetteModelSpecs['displayName']
  onCloseClick: () => void
  isExpanded: boolean
  pipetteId: AttachedPipette['id']
}

export const PipetteSettingsSlideout = (
  props: PipetteSettingsSlideoutProps
): JSX.Element | null => {
  const { pipetteName, robotName, isExpanded, pipetteId, onCloseClick } = props
  const { t } = useTranslation('device_details')
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const updateSettings = (fields: PipetteSettingsFieldsUpdate): void => {
    dispatchRequest(updatePipetteSettings(robotName, pipetteId, fields))
  }
  const latestRequestId = last(requestIds)
  const updateRequest = useSelector((state: State) =>
    latestRequestId != null ? getRequestById(state, latestRequestId) : null
  )
  const FORM_ID = `configurePipetteForm_${pipetteId}`
  const keyboardRef = React.useRef(null)

  const handleChange = (): void => {
    console.log('numpad rendered')
  }

  useInterval(
    () => {
      dispatch(fetchPipetteSettings(robotName))
    },
    FETCH_PIPETTES_INTERVAL_MS,
    true
  )

  return (
    <>
      {true && (
        <Flex
          position={POSITION_ABSOLUTE}
          left="5%"
          bottom="10%"
          zIndex="10"
          width="31.25rem"
        >
          <Numpad onChange={handleChange} keyboardRef={keyboardRef} />
        </Flex>
      )}
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
            pipetteId={pipetteId}
            updateRequest={updateRequest}
            updateSettings={updateSettings}
            robotName={robotName}
            formId={FORM_ID}
          />
        </Flex>
      </Slideout>
    </>
  )
}
