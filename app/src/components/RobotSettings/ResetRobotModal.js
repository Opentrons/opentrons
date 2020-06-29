// @flow
import { AlertModal, LabeledCheckbox } from '@opentrons/components'
import last from 'lodash/last'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchResetConfigOptions,
  getResetConfigOptions,
  resetConfig,
} from '../../robot-admin'
import type { ResetConfigRequest } from '../../robot-admin/types'
import {
  getRequestById,
  PENDING,
  SUCCESS,
  useDispatchApiRequest,
} from '../../robot-api'
import type { Dispatch, State } from '../../types'
import { Portal } from '../portal'

export type ResetRobotModalProps = {|
  robotName: string,
  closeModal: () => mixed,
|}

const TITLE = 'Robot Configuration Reset'

export function ResetRobotModal(props: ResetRobotModalProps): React.Node {
  const { robotName, closeModal } = props
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const resetRequestStatus = useSelector((state: State) => {
    return getRequestById(state, last(requestIds))
  })?.status

  const triggerReset = () =>
    dispatchRequest(resetConfig(robotName, resetOptions))

  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )

  React.useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [robotName, dispatch])

  React.useEffect(() => {
    if (resetRequestStatus === SUCCESS) closeModal()
  }, [resetRequestStatus, closeModal])

  const buttons = [
    { onClick: closeModal, children: 'close' },
    {
      onClick: triggerReset,
      disabled: resetRequestStatus === PENDING,
      children: 'restart',
    },
  ]

  return (
    <Portal>
      <AlertModal heading={TITLE} buttons={buttons} alertOverlay>
        <p>
          Warning! Clicking <strong>restart</strong> will erase your selected
          configurations and <strong>restart your robot</strong>. This cannot be
          undone
        </p>
        {options.map(o => (
          <LabeledCheckbox
            label={o.name}
            onChange={() => {
              setResetOptions({ ...resetOptions, [o.id]: !resetOptions[o.id] })
            }}
            name={o.id}
            value={resetOptions[o.id]}
            key={o.id}
          >
            <p>{o.description}</p>
          </LabeledCheckbox>
        ))}
      </AlertModal>
    </Portal>
  )
}
