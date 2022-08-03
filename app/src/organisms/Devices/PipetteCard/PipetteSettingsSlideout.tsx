import * as React from 'react'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, useInterval } from '@opentrons/components'
import { PipetteModelSpecs } from '@opentrons/shared-data'
import {
  fetchPipetteSettings,
  updatePipetteSettings,
} from '../../../redux/pipettes'
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
} from '../../../redux/pipettes/types'
import type { Dispatch, State } from '../../../redux/types'

const FETCH_PIPETTES_INTERVAL_MS = 5000

interface PipetteSettingsSlideoutProps {
  robotName: string
  pipetteName: PipetteModelSpecs['displayName']
  onCloseClick: () => unknown
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

  useInterval(
    () => {
      dispatch(fetchPipetteSettings(robotName))
    },
    FETCH_PIPETTES_INTERVAL_MS,
    true
  )

  return (
    <Slideout
      title={t('pipette_settings', { pipetteName: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <ConfigFormSubmitButton disabled={updateRequest?.status === PENDING} />
      }
    >
      <Flex data-testid={`PipetteSettingsSlideout_${robotName}_${pipetteId}`}>
        <ConfigurePipette
          closeModal={onCloseClick}
          pipetteId={pipetteId}
          updateRequest={updateRequest}
          updateSettings={updateSettings}
          robotName={robotName}
        />
      </Flex>
    </Slideout>
  )
}
