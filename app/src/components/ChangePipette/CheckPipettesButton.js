// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'

import { PrimaryButton, Icon } from '@opentrons/components'
import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  SUCCESS,
} from '../../robot-api'

import { fetchPipettes } from '../../pipettes'

import type { State } from '../../types'
import type { RequestState } from '../../robot-api/types'
import type { FetchPipettesAction } from '../../pipettes/types'

export type CheckPipetteButtonProps = {|
  robotName: string,
  className: string,
  children: React.Node,
  onDone?: () => mixed,
|}

export function CheckPipettesButton(
  props: CheckPipetteButtonProps
): React.Node {
  const { robotName, onDone, className, children } = props
  const [dispatch, requestIds] = useDispatchApiRequest<FetchPipettesAction>()
  const handleClick = () => dispatch(fetchPipettes(robotName, true))
  const requestStatus = useSelector<State, RequestState | null>(state =>
    getRequestById(state, last(requestIds))
  )?.status
  const pending = requestStatus === PENDING

  React.useEffect(() => {
    if (requestStatus === SUCCESS && onDone) onDone()
  }, [onDone, requestStatus])

  return (
    <PrimaryButton
      onClick={handleClick}
      disabled={pending}
      className={className}
    >
      {pending ? <Icon name="ot-spinner" height="1em" spin /> : children}
    </PrimaryButton>
  )
}
