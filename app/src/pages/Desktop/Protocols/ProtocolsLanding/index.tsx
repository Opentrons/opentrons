import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ProtocolList } from '/app/organisms/Desktop/ProtocolsLanding/ProtocolList'
import { ProtocolsEmptyState } from '/app/organisms/Desktop/ProtocolsLanding/ProtocolsEmptyState'
import { fetchProtocols, getStoredProtocols } from '/app/redux/protocol-storage'

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
