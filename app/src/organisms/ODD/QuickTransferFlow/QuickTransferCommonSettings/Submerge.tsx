import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { useState } from 'react'
import type { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface SubmergeProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Submerge({
  onBack,
  state,
  dispatch,
  kind,
}: SubmergeProps): JSX.Element {
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const [currentStep, setCurrentStep] = useState<number>(1)
  return <div>Submerge</div>
}
