import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { SlotDetails } from '../Protocols/ProtocolVisualization/SlotDetails'

import type {
  Liquid,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface StepDetailData {
  analysis: ProtocolAnalysisOutput
  robotState: RobotState
  invariantContext: InvariantContext
  command: RunTimeCommand
  slot: string
  liquids: Liquid[]
}
interface StepDetailViewerParams {
  protocolKey: string
}

export function StepDetailViewer(): JSX.Element {
  const { protocolKey } = useParams<
    keyof StepDetailViewerParams
  >() as StepDetailViewerParams

  const [data, setData] = useState<StepDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async (): Promise<void> => {
      try {
        const result: StepDetailData =
          await global.APP_SHELL_REMOTE.ipcRenderer.invoke(
            'get-step-detail-data',
            protocolKey
          )
        if (isMounted) {
          setData(result)
          setLoading(false)
        }
      } catch (error) {
        console.error(error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // initial fetch
    fetchData()

    // listen for updates
    const listener = (_event: unknown, updatedKey: string): void => {
      if (updatedKey === protocolKey) {
        fetchData()
      }
    }

    global.APP_SHELL_REMOTE.ipcRenderer.on('step-detail-data-updated', listener)

    return () => {
      isMounted = false
      global.APP_SHELL_REMOTE.ipcRenderer.removeListener(
        'step-detail-data-updated',
        listener
      )
    }
  }, [protocolKey])

  if (loading) {
    return <div>loading</div>
  }
  if (!data) {
    return <div>no data found</div>
  }
  const { slot, command, robotState, invariantContext, analysis, liquids } =
    data

  return (
    <SlotDetails
      slotId={slot}
      command={command}
      robotState={robotState}
      invariantContext={invariantContext}
      analysis={analysis}
      liquids={liquids}
    />
  )
}
