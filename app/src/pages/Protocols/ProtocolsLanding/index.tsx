import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchProtocols,
  getStoredProtocols,
} from '../../../redux/protocol-storage'
import { ProtocolsEmptyState } from '../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import { ProtocolList } from '../../../organisms/ProtocolsLanding/ProtocolList'
import { getIsOnDevice } from '../../../redux/config'
import { getLocalRobot } from '../../../redux/discovery'

import type { Dispatch, State } from '../../../redux/types'

export function ProtocolsLanding(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const isOnDevice = useSelector(getIsOnDevice)
  const isLocalRobot = useSelector(getLocalRobot)
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  console.log('isOnDevice: ', isOnDevice)

  return (
    <>
      {isLocalRobot ? 'local' : 'remote'}
      {isOnDevice ? 'onDevice' : 'nooooooooo'}
      {storedProtocols.length > 0 ? (
        <ProtocolList storedProtocols={storedProtocols} />
      ) : (
        <ProtocolsEmptyState />
      )}
    </>
  )
}
