import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Redirect } from 'react-router-dom'

import type { DesktopRouteParams } from '../../../App/types'
import { ProtocolDetails as ProtocolDetailsContents } from '../../../organisms/ProtocolDetails'
import {
  fetchProtocols,
  getStoredProtocol,
} from '../../../redux/protocol-storage'
import type { Dispatch, State } from '../../../redux/types'

export function ProtocolDetails(): JSX.Element {
  const { protocolKey } = useParams<DesktopRouteParams>()

  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )

  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return storedProtocol != null ? (
    <ProtocolDetailsContents {...storedProtocol} />
  ) : (
    <Redirect to="/protocols" />
  )
}
