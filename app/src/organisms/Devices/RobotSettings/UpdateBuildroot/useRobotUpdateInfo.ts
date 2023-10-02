import * as React from 'react'
import type { RobotUpdateSession } from '../../../../redux/robot-update/types'

export function useRobotUpdateInfo(
  session: RobotUpdateSession | null
): { updateStep: UpdateStep; progressPercent: number } {
  const shellReportedUpdateStep = React.useMemo(
    () => getShellReportedUpdateStep(session),
    [session]
  )

  const updateStep = useTransitionUpdateStepFrom(shellReportedUpdateStep)
  const progressPercent = useFindProgressPercentFrom(
    updateStep,
    session?.fileInfo?.isManualFile ?? false,
    session?.progress
  )

  return { updateStep, progressPercent }
}

export type UpdateStep =
  | 'initial'
  | 'download'
  | 'install'
  | 'restart'
  | 'finished'
  | 'error'

function getShellReportedUpdateStep(
  session: RobotUpdateSession | null
): UpdateStep | null {
  if (session == null) return null
  const { step: sessionStep, stage: sessionStage, error } = session

  // TODO(jh, 09-14-2023: add download logic to app-shell/redux/progress bar.
  let reportedUpdateStep: UpdateStep
  if (error != null) {
    reportedUpdateStep = 'error'
  } else if (sessionStep == null && sessionStage == null) {
    reportedUpdateStep = 'initial'
  } else if (sessionStep === 'finished') {
    reportedUpdateStep = 'finished'
  } else if (
    sessionStep === 'restart' ||
    sessionStep === 'restarting' ||
    sessionStage === 'ready-for-restart'
  ) {
    reportedUpdateStep = 'restart'
  } else {
    reportedUpdateStep = 'install'
  }

  return reportedUpdateStep
}

function useTransitionUpdateStepFrom(
  reportedUpdateStep: UpdateStep | null
): UpdateStep {
  const [updateStep, setUpdateStep] = React.useState<UpdateStep>('initial')
  const prevUpdateStep = React.useRef<UpdateStep | null>(null)

  if (reportedUpdateStep === 'initial' && updateStep !== 'initial') {
    setUpdateStep('initial')
    prevUpdateStep.current = null
  } else if (reportedUpdateStep === 'error' && updateStep !== 'error') {
    setUpdateStep('error')
  } else if (updateStep === 'initial') {
    if (reportedUpdateStep === 'install' && prevUpdateStep.current == null) {
      setUpdateStep('install')
      prevUpdateStep.current = 'initial'
    }
  } else if (updateStep === 'install') {
    if (
      reportedUpdateStep === 'restart' &&
      prevUpdateStep.current === 'initial'
    ) {
      setUpdateStep('restart')
      prevUpdateStep.current = 'install'
    }
  } else if (updateStep === 'restart') {
    if (
      reportedUpdateStep === 'finished' &&
      prevUpdateStep.current === 'install'
    ) {
      setUpdateStep('finished')
      prevUpdateStep.current = 'restart'
    }
  }
  return updateStep
}

function useFindProgressPercentFrom(
  updateStep: UpdateStep,
  filePathUsedForUpdate: boolean,
  stepProgress?: number | null
): number {
  const [progressPercent, setProgressPercent] = React.useState<number>(0)
  const prevSeenStepProgress = React.useRef<number>(0)
  const currentStepWithProgress = React.useRef<number>(0)

  const TOTAL_STEPS_WITH_PROGRESS = filePathUsedForUpdate ? 2 : 2

  if (updateStep === 'initial' && progressPercent !== 0) {
    setProgressPercent(0)
    prevSeenStepProgress.current = 0
  } else if (updateStep === 'restart' || updateStep === 'finished') {
    if (progressPercent !== 100) {
      setProgressPercent(100)
      prevSeenStepProgress.current = 100
    }
    return progressPercent
  } else if (
    updateStep === 'error' ||
    stepProgress == null ||
    stepProgress === prevSeenStepProgress.current
  ) {
    return progressPercent
  } else {
    // Assume new step instead of stepProgress backtracking.
    if (prevSeenStepProgress.current > 85 && stepProgress <= 60) {
      currentStepWithProgress.current += 1
      const completedStepsWithProgress =
        (100 * currentStepWithProgress.current) / TOTAL_STEPS_WITH_PROGRESS
      prevSeenStepProgress.current = 0
      setProgressPercent(Math.round(completedStepsWithProgress + stepProgress))
    } else {
      const currentStepProgress =
        progressPercent +
        (stepProgress - prevSeenStepProgress.current) /
          TOTAL_STEPS_WITH_PROGRESS
      const nonBacktrackedProgressPercent = Math.max(
        progressPercent,
        currentStepProgress
      )
      setProgressPercent(Math.round(nonBacktrackedProgressPercent))
    }
    prevSeenStepProgress.current = stepProgress
  }

  return progressPercent
}
