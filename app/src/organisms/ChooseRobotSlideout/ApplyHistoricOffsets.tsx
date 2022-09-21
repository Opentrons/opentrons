import * as React from 'react'
import { useOffsetCandidatesForAnalysis } from '../ReapplyOffsetsModal/hooks/useOffsetCandidatesForAnalysis'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

interface ApplyHistoricOffsetsProps {
  analysisOutput: ProtocolAnalysisOutput,
  robotIp: string | null
}
export function ApplyHistoricOffsets(props: ApplyHistoricOffsetsProps): JSX.Element {
  const {analysisOutput, robotIp} = props
  if (robotIp == null) return <div>NO OFFSETS</div>
  const offsetCandidates = useOffsetCandidatesForAnalysis(analysisOutput, robotIp)
  console.log(offsetCandidates)
  return <div>APPLY OFFSETS</div>
}