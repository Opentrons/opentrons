import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { SlotDetails } from '/app/organisms/Desktop/ProtocolVisualization/SlotDetails'

import { SkeletonForSlotDetail } from './SkeletonForSlotDetail'

import type { ReactNode } from 'react'
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

export function StepDetailViewer(): ReactNode {
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
    void fetchData()

    // listen for updates
    const listener = (_event: unknown, updatedKey: string): void => {
      if (updatedKey === protocolKey) {
        void fetchData()
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
    return <SkeletonForSlotDetail />
  }
  if (data === null) {
    return <div>no data found</div>
  }
  const { slot, robotState, invariantContext, analysis, liquids } = data

  return (
    <SlotDetails
      slotId={slot}
      robotState={robotState}
      invariantContext={invariantContext}
      analysis={analysis}
      liquids={liquids}
    />
  )
}
