import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'
import { useTranslation } from 'react-i18next'
import { Box } from '@opentrons/components'
import {
  SUCCESS,
  FAILURE,
  PENDING,
  useDispatchApiRequest,
  getRequestById,
} from '../../redux/robot-api'
import {
  getAttachedPipettes,
  getAttachedPipetteSettings,
  updatePipetteSettings,
} from '../../redux/pipettes'
import { useFeatureFlag } from '../../redux/config'
import { ConfigForm } from './ConfigForm'
import { ConfigErrorBanner } from './ConfigErrorBanner'

import type { State } from '../../redux/types'

import type {
  Mount,
  PipetteSettingsFieldsUpdate,
} from '../../redux/pipettes/types'

interface Props {
  robotName: string
  mount: Mount
  closeModal: () => unknown
}

export function ConfigurePipette(props: Props): JSX.Element {
  const { robotName, mount, closeModal } = props
  const { t } = useTranslation('device_details')
  const [dispatchRequest, requestIds] = useDispatchApiRequest()

  const pipette = useSelector(
    (state: State) => getAttachedPipettes(state, robotName)[mount]
  )
  const settings = useSelector(
    (state: State) => getAttachedPipetteSettings(state, robotName)[mount]
  )

  const updateSettings = (fields: PipetteSettingsFieldsUpdate): void => {
    if (pipette) {
      dispatchRequest(updatePipetteSettings(robotName, pipette.id, fields))
    }
  }

  const updateRequest = useSelector((state: State) =>
    // @ts-expect-error(sa, 2021-05-27): avoiding src code change, verify last(requestIds) is not undefined
    getRequestById(state, last(requestIds))
  )

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
      {settings && (
        <ConfigForm
          settings={settings}
          updateInProgress={updateRequest?.status === PENDING}
          updateSettings={updateSettings}
          closeModal={closeModal}
          __showHiddenFields={__showHiddenFields}
        />
      )}
    </Box>
  )
}
