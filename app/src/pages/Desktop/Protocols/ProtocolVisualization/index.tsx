import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { COLORS, Icon } from '@opentrons/components'

import {
  fetchProtocols,
  getStoredProtocol,
  getStoredProtocolGroupedCommands,
} from '/app/redux/protocol-storage'

import styles from './preview.module.css'
import { VisualizerContainer } from './VisualizerContainer'

import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function ProtocolVisualization(): JSX.Element {
  const { protocolKey } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const navigate = useNavigate()
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

  // this is for an edge case
  // a user tries to access the visualization page from the protocol setup page by re-running the protocol
  // this will be fixed in protocol visualization phase 2
  useEffect(() => {
    if (storedProtocol?.mostRecentAnalysis == null) {
      navigate(-1)
    }
  }, [storedProtocol?.mostRecentAnalysis, navigate])

  return storedProtocol?.mostRecentAnalysis != null ? (
    <VisualizerContainer
      analysis={storedProtocol.mostRecentAnalysis}
      groupedCommands={groupedCommands}
      protocolKey={protocolKey}
      srcFileNames={storedProtocol.srcFileNames}
    />
  ) : (
    <div className={styles.loading_icon}>
      <Icon size="8rem" name="ot-spinner" spin color={COLORS.blue50} />
    </div>
  )
}
