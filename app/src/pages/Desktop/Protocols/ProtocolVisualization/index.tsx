import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { COLORS, Icon } from '@opentrons/components'

import {
  fetchProtocols,
  getStoredProtocol,
  getStoredProtocolGroupedCommands,
} from '/app/redux/protocol-storage'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { VisualizerContainer } from '../../../../organisms/Desktop/ProtocolVisualization/VisualizerContainer'
import styles from './visualization.module.css'

import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function ProtocolVisualization(): JSX.Element {
  const { runId, protocolKey } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const groupedCommands = useSelector((state: State) =>
    getStoredProtocolGroupedCommands(state, protocolKey)
  )
  useEffect(() => {
    dispatch(fetchProtocols())
  }, [])
  console.log('robotProtocolAnalysis', robotProtocolAnalysis, protocolKey)
  return storedProtocol != null && storedProtocol.mostRecentAnalysis != null ? (
    <div className={styles.top_container}>
      <VisualizerContainer
        analysisOutput={storedProtocol.mostRecentAnalysis}
        completedProtocolAnalysis={robotProtocolAnalysis}
        groupedCommands={groupedCommands}
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
