import * as React from 'react'
import difference from 'lodash/difference'
import { useQueryClient } from 'react-query'
import { useDispatch } from 'react-redux'
import { useInterval } from '@opentrons/components'
import { getProtocol } from '@opentrons/api-client/src'
import { useAllProtocolIdsQuery, useHost } from '@opentrons/react-api-client'
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

const PROTOCOL_IDS_RECHECK_INTERVAL_MS = 3000
export function useProtocolReceiptToast(): void {
  const protocolIdsQuery = useAllProtocolIdsQuery({
    refetchInterval: PROTOCOL_IDS_RECHECK_INTERVAL_MS,
  })
  const protocolIds = protocolIdsQuery.data?.data ?? []
  const host = useHost()
  const { makeToast } = useToaster()
  const queryClient = useQueryClient()

  const protocolIdsRef = React.useRef(protocolIds)

  React.useEffect(() => {
    if (protocolIds.length > protocolIdsRef.current.length) {
      const newProtocolIds = difference(protocolIds, protocolIdsRef.current)

      Promise.all(
        newProtocolIds.map(protocolId => {
          if (host != null) {
            return (
              getProtocol(host, protocolId).then(data => data.data.data.id) ??
              ''
            )
          } else {
            return Promise.reject(
              new Error(
                'no host provider info inside of useProtocolReceiptToast'
              )
            )
          }
        })
      )
        .then(protocolNames => {
          protocolNames.forEach(name => {
            makeToast(`new protocol ${name} added to robot!`, 'info')
          })
        })
        .then(() => {
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) =>
              console.error(`error invalidating protocols query: ${e.message}`)
            )
        })
        .then(() => {
          protocolIdsRef.current = protocolIds
        })
        .catch((e: Error) => {
          console.error(e)
        })
    }
  })
}
