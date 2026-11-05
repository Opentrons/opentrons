import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import { ProtocolDetailsContents } from '/app/organisms/Desktop/ProtocolDetails'
import {
  fetchProtocols,
  getStoredProtocol,
  getStoredProtocolGroupedCommands,
} from '/app/redux/protocol-storage'

import type { ReactNode } from 'react'
import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function ProtocolDetails(): ReactNode {
  const { protocolKey } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams

  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )
  const groupedCommands = useSelector((state: State) =>
    getStoredProtocolGroupedCommands(state, protocolKey)
  )
  useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return storedProtocol != null ? (
    <ProtocolDetailsContents
      {...storedProtocol}
      groupedCommands={groupedCommands}
    />
  ) : (
    <Navigate to="/protocols" />
  )
}
