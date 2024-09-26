import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'
import { fetchProtocols, getStoredProtocol } from '/app/redux/protocol-storage'
import { ProtocolDetails as ProtocolDetailsContents } from '/app/organisms/ProtocolDetails'

import type { Dispatch, State } from '/app/redux/types'
import type { DesktopRouteParams } from '../../../../App/types'

export function ProtocolDetails(): JSX.Element {
  const { protocolKey } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams

  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )

  useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return storedProtocol != null ? (
    <ProtocolDetailsContents {...storedProtocol} />
  ) : (
    <Navigate to="/protocols" />
  )
}
