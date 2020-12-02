// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  useDispatchApiRequests,
  getRequestById,
  PENDING,
  SUCCESS,
} from '../../robot-api'

import { fetchPipettes, FETCH_PIPETTES } from '../../pipettes'
import { PrimaryButton, Icon } from '@opentrons/components'

import type { State } from '../../types'
import type { RequestState } from '../../robot-api/types'
import type { FetchPipettesAction } from '../../pipettes/types'

export type CheckPipetteButtonProps = {|
  robotName: string,
  className: string,
  children: React.Node,
  hidden?: boolean,
  onDone?: () => mixed,
|}

export function CheckPipettesButton(
  props: CheckPipetteButtonProps
): React.Node {
  const { robotName, onDone, className, children, hidden = false } = props
  const fetchPipettesRequestId = React.useRef<string | null>(null)
  const [dispatch] = useDispatchApiRequests<FetchPipettesAction>(
    dispatchedAction => {
      if (
        dispatchedAction.type === FETCH_PIPETTES &&
        dispatchedAction.meta.requestId
      ) {
        fetchPipettesRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )
  const handleClick = () => dispatch(fetchPipettes(robotName, true))
  const requestStatus = useSelector<State, RequestState | null>(state =>
    fetchPipettesRequestId.current
      ? getRequestById(state, fetchPipettesRequestId.current)
      : null
  )?.status
  const pending = requestStatus === PENDING

  React.useEffect(() => {
    if (requestStatus === SUCCESS && onDone) onDone()
  }, [onDone, requestStatus])

  return hidden ? null : (
    <PrimaryButton
      onClick={handleClick}
      disabled={pending}
      className={className}
    >
      {pending ? <Icon name="ot-spinner" height="1em" spin /> : children}
    </PrimaryButton>
  )
}
