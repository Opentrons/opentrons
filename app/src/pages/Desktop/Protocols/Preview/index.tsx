import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { Icon } from '@opentrons/components'

import { fetchProtocols, getStoredProtocol } from '/app/redux/protocol-storage'

import { Container } from './Container'

import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function Preview(): JSX.Element {
  const { protocolKey } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )

  useEffect(() => {
    dispatch(fetchProtocols())
  }, [])

  return storedProtocol != null && storedProtocol.mostRecentAnalysis != null ? (
    <Container analysis={storedProtocol.mostRecentAnalysis} />
  ) : (
    <Icon size="8rem" name="ot-spinner" spin />
  )
}
{
  /* <ProtocolTimelineScrubber analysis={storedProtocol.mostRecentAnalysis} /> */
}
