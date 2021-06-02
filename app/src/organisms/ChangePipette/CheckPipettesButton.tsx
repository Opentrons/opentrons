import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  useDispatchApiRequests,
  getRequestById,
  PENDING,
  SUCCESS,
} from '../../redux/robot-api'

import { fetchPipettes, FETCH_PIPETTES } from '../../redux/pipettes'
import { PrimaryButton, Icon } from '@opentrons/components'

import type { State } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'

export interface CheckPipetteButtonProps {
  robotName: string
  className: string
  children: React.ReactNode
  hidden?: boolean
  onDone?: () => unknown
}

export function CheckPipettesButton(
  props: CheckPipetteButtonProps
): JSX.Element | null {
  const { robotName, onDone, className, children, hidden = false } = props
  const fetchPipettesRequestId = React.useRef<string | null>(null)
  const [dispatch] = useDispatchApiRequests(dispatchedAction => {
    if (
      dispatchedAction.type === FETCH_PIPETTES &&
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to type narrow
      dispatchedAction.meta.requestId
    ) {
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to type narrow
      fetchPipettesRequestId.current = dispatchedAction.meta.requestId
    }
  })

  const handleClick = (): void => dispatch(fetchPipettes(robotName, true))
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
