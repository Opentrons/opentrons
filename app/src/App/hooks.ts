import * as React from 'react'
import difference from 'lodash/difference'
import { useDispatch } from 'react-redux'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'
import { useInterval } from '@opentrons/components'
import { checkShellUpdate } from '../redux/shell'
import { useToaster } from '../organisms/ToasterOven'

import type { Dispatch } from '../redux/types'

const UPDATE_RECHECK_INTERVAL_MS = 60000
export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}

export function useProtocolReceiptToast(): void {
  const protocols = useAllProtocolsQuery().data?.data ?? []
  const protocolIds = protocols.map(({ id }) => id)
  const { makeToast } = useToaster()

  const protocolIdsRef = React.useRef(protocolIds)

  React.useEffect(() => {
    if (protocolIds.length > protocolIdsRef.current.length) {
      const newProtocolIds = difference(protocolIds, protocolIdsRef.current)
      const protocolNames = newProtocolIds.map(
        id => protocols.find(p => p.id === id)?.metadata.protocolName ?? ''
      )
      protocolNames.forEach(name => {
        makeToast(`new protocol ${name} added to robot!`, 'info')
      })
      protocolIdsRef.current = protocolIds
    }
  })
}
