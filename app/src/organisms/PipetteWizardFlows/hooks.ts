import * as React from 'react'
import { useSelector } from 'react-redux'
import { fetchPipettes, FETCH_PIPETTES } from '../../redux/pipettes'
import {
  getRequestById,
  useDispatchApiRequests,
  PENDING,
} from '../../redux/robot-api'
import type { RequestState, RequestStatus } from '../../redux/robot-api/types'
import type { State } from '../../redux/types'

interface CheckPipettes {
  handleCheckPipette: () => void
  isPending: boolean
  requestStatus?: RequestStatus
}

export function useCheckPipettes(robotName: string): CheckPipettes {
  const fetchPipettesRequestId = React.useRef<string | null>(null)
  const [dispatch] = useDispatchApiRequests(dispatchedAction => {
    if (
      dispatchedAction.type === FETCH_PIPETTES &&
      'requestId' in dispatchedAction.meta &&
      dispatchedAction.meta.requestId
    ) {
      fetchPipettesRequestId.current = dispatchedAction.meta.requestId
    }
  })
  const handleCheckPipette = (): void =>
    dispatch(fetchPipettes(robotName, true))
  const requestStatus = useSelector<State, RequestState | null>(state =>
    fetchPipettesRequestId.current
      ? getRequestById(state, fetchPipettesRequestId.current)
      : null
  )?.status
  const isPending = requestStatus === PENDING

  return {
    handleCheckPipette,
    isPending,
    requestStatus,
  }
}
