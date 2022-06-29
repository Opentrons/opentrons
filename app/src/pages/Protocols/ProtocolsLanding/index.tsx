import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, POSITION_RELATIVE } from '@opentrons/components'

import {
  fetchProtocols,
  getStoredProtocols,
} from '../../../redux/protocol-storage'
import { ProtocolsEmptyState } from '../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import { ProtocolList } from '../../../organisms/ProtocolsLanding/ProtocolList'

import type { Dispatch, State } from '../../../redux/types'

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
    <Flex position={POSITION_RELATIVE}>
      <ProtocolsEmptyState />
    </Flex>
  )
}
