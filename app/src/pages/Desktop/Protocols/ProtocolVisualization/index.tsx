import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { COLORS, Icon } from '@opentrons/components'

import {
  fetchProtocols,
  getStoredProtocol,
  getStoredProtocolGroupedCommands,
} from '/app/redux/protocol-storage'

import { VisualizerContainer } from '../../../../organisms/Desktop/ProtocolVisualization/VisualizerContainer'
import styles from './visualization.module.css'

import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function ProtocolVisualization(): JSX.Element {
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

  // CRITICAL FIX:
  // We must use Object.assign on a cloned array.
  // This attaches the 'id' property required by VisualizerContainer
  // while preserving the Array prototype so .map() still works.
  const groupedCommandsWithId = useMemo(() => {
    if (groupedCommands == null) return null
    return Object.assign([...groupedCommands], { id: protocolKey })
  }, [groupedCommands, protocolKey])

  useEffect(() => {
    dispatch(fetchProtocols())
  }, [])

  return storedProtocol != null && storedProtocol.mostRecentAnalysis != null ? (
    <div className={styles.top_container}>
      <VisualizerContainer
        analysis={storedProtocol.mostRecentAnalysis}
        groupedCommands={groupedCommandsWithId}
        protocolKey={protocolKey}
        srcFileNames={storedProtocol.srcFileNames}
      />
    </div>
  ) : (
    <div className={styles.loading_icon}>
      <Icon size="8rem" name="ot-spinner" spin color={COLORS.blue50} />
    </div>
  )
}