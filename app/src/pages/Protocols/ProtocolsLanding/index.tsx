import { ProtocolList } from '../../../organisms/ProtocolsLanding/ProtocolList'
import { ProtocolsEmptyState } from '../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import {
  fetchProtocols,
  getStoredProtocols,
} from '../../../redux/protocol-storage'
import type { Dispatch, State } from '../../../redux/types'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

export function ProtocolsLanding(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return storedProtocols.length > 0 ? (
    <ProtocolList storedProtocols={storedProtocols} />
  ) : (
    <ProtocolsEmptyState />
  )
}
