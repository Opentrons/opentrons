import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { COLORS, Icon } from '@opentrons/components'

import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { useRobot } from '/app/redux-resources/robots'
import { fetchProtocols, getStoredProtocol } from '/app/redux/protocol-storage'
import { getGroupedCommands } from '/app/redux/protocol-storage/utils'

import { VisualizerContainer } from '../../../../organisms/Desktop/ProtocolVisualization/VisualizerContainer'
import styles from './visualization.module.css'

import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function ProtocolVisualization(): JSX.Element {
  const { runId, protocolKey, robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )

  // this is used for step grouping which won't be introduced until
  // PV phase 2
  const mostRecentAnalysis = storedProtocol?.mostRecentAnalysis ?? null
  const groupedCommands = useMemo(
    () =>
      mostRecentAnalysis?.commandAnnotations != null &&
      mostRecentAnalysis.commandAnnotations.length > 0
        ? getGroupedCommands(mostRecentAnalysis)
        : [],
    [mostRecentAnalysis]
  )

  useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  const visualizer =
    mostRecentAnalysis != null ? (
      <VisualizerContainer
        analysisOutput={mostRecentAnalysis}
        runId={runId}
        groupedCommands={groupedCommands}
        protocolKey={protocolKey}
        srcFileNames={storedProtocol?.srcFileNames ?? []}
      />
    ) : (
      <LoadingIcon />
    )

  // when accessing via /protocols
  if (runId == null) {
    return visualizer
  }

  // when accessing via /devices
  if (robot == null) {
    return <LoadingIcon />
  }
  return <ApiHostProvider robotName={robotName}>{visualizer}</ApiHostProvider>
}

const LoadingIcon = (): JSX.Element => {
  return (
    <div className={styles.loading_icon}>
      <Icon size="8rem" name="ot-spinner" spin color={COLORS.blue50} />
    </div>
  )
}
