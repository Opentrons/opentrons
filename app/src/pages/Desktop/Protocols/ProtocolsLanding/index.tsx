import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProtocols, getStoredProtocols } from '/app/redux/protocol-storage'
import { ProtocolsEmptyState } from '/app/organisms/Desktop/ProtocolsLanding/ProtocolsEmptyState'
import { ProtocolList } from '/app/organisms/Desktop/ProtocolsLanding/ProtocolList'

import type { Dispatch, State } from '/app/redux/types'

export function ProtocolsLanding(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return storedProtocols.length > 0 ? (
    <ProtocolList storedProtocols={storedProtocols} />
  ) : (
    <ProtocolsEmptyState />
  )
}
