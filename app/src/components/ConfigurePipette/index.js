// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  SUCCESS,
  FAILURE,
  PENDING,
  useDispatchApiRequest,
  getRequestById,
} from '../../robot-api'
import {
  getAttachedPipettes,
  getAttachedPipetteSettings,
  updatePipetteSettings,
} from '../../pipettes'
import { getConfig } from '../../config'

import { ScrollableAlertModal } from '../modals'
import { ConfigMessage } from './ConfigMessage'
import { ConfigForm } from './ConfigForm'
import { ConfigErrorBanner } from './ConfigErrorBanner'

import type { State } from '../../types'

import type { Mount, PipetteSettingsFieldsUpdate } from '../../pipettes/types'

// TODO(mc, 2019-12-09): i18n
const PIPETTE_SETTINGS = 'Pipette Settings'
const AN_ERROR_OCCURRED_WHILE_UPDATING =
  "An error occurred while updating your pipette's settings. Please try again."

type Props = {|
  robotName: string,
  mount: Mount,
  closeModal: () => mixed,
|}

export function ConfigurePipette(props: Props): React.Node {
  const { robotName, mount, closeModal } = props
  const [dispatchRequest, requestIds] = useDispatchApiRequest()

  const pipette = useSelector(
    (state: State) => getAttachedPipettes(state, robotName)[mount]
  )
  const settings = useSelector(
    (state: State) => getAttachedPipetteSettings(state, robotName)[mount]
  )

  const updateSettings = (fields: PipetteSettingsFieldsUpdate) => {
    if (pipette) {
      dispatchRequest(updatePipetteSettings(robotName, pipette.id, fields))
    }
  }

  const updateRequest = useSelector((state: State) =>
    getRequestById(state, last(requestIds))
  )

  const updateError: string | null =
    updateRequest && updateRequest.status === FAILURE
      ? updateRequest.error.message || AN_ERROR_OCCURRED_WHILE_UPDATING
      : null

  // TODO(mc, 2019-12-09): remove this feature flag
  const __showHiddenFields = useSelector((state: State) =>
    Boolean(getConfig(state).devInternal?.allPipetteConfig)
  )

  // when an in-progress request completes, close modal if response was ok
  React.useEffect(() => {
    if (updateRequest?.status === SUCCESS) {
      closeModal()
    }
  }, [updateRequest, closeModal])

  return (
    <ScrollableAlertModal
      heading={`${PIPETTE_SETTINGS}: ${pipette?.modelSpecs.displayName || ''}`}
      alertOverlay
    >
      {updateError && <ConfigErrorBanner message={updateError} />}
      <ConfigMessage />
      {settings && (
        <ConfigForm
          settings={settings}
          updateInProgress={updateRequest?.status === PENDING}
          updateSettings={updateSettings}
          closeModal={closeModal}
          __showHiddenFields={__showHiddenFields}
        />
      )}
    </ScrollableAlertModal>
  )
}
