import * as React from 'react'
import type { RobotUpdateSession } from '../../../../redux/robot-update/types'

export function useRobotUpdateInfo(
  session: RobotUpdateSession | null
): { updateStep: UpdateStep; progressPercent: number } {
  const progressPercent = useFindProgressPercentFrom(session)

  const shellReportedUpdateStep = React.useMemo(
    () => getShellReportedUpdateStep(session),
    [session]
  )
  const updateStep = useTransitionUpdateStepFrom(shellReportedUpdateStep)

  return {
    updateStep,
    progressPercent,
  }
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

// Shell steps sometimes backtrack, so use guarded transitions.
function useTransitionUpdateStepFrom(
  reportedUpdateStep: UpdateStep | null
): UpdateStep {
  const [updateStep, setUpdateStep] = React.useState<UpdateStep>('initial')
  const prevUpdateStep = React.useRef<UpdateStep | null>(null)

  switch (reportedUpdateStep) {
    case 'initial':
      if (updateStep !== 'initial') {
        setUpdateStep('initial')
        prevUpdateStep.current = null
      }
      break
    case 'error':
      if (updateStep !== 'error') {
        setUpdateStep('error')
      }
      break
    case 'install':
      if (updateStep === 'initial' && prevUpdateStep.current == null) {
        setUpdateStep('install')
        prevUpdateStep.current = 'initial'
      }
      break
    case 'restart':
      if (updateStep === 'install' && prevUpdateStep.current === 'initial') {
        setUpdateStep('restart')
        prevUpdateStep.current = 'install'
      }
      break
    case 'finished':
      if (updateStep === 'restart' && prevUpdateStep.current === 'install') {
        setUpdateStep('finished')
        prevUpdateStep.current = 'restart'
      }
      break
  }
  return updateStep
}

function useFindProgressPercentFrom(
  session: RobotUpdateSession | null
): number {
  const [progressPercent, setProgressPercent] = React.useState<number>(0)
  const prevSeenUpdateStep = React.useRef<string | null>(null)
  const prevSeenStepProgress = React.useRef<number>(0)
  const currentStepWithProgress = React.useRef<number>(-1)

  if (session == null) return progressPercent

  const {
    fileInfo,
    step: sessionStep,
    stage: sessionStage,
    progress: stepProgress,
  } = session

  const TOTAL_STEPS_WITH_PROGRESS = fileInfo?.isManualFile ? 3 : 3

  if (sessionStep === 'getToken') {
    if (progressPercent !== 0) {
      setProgressPercent(0)
      prevSeenStepProgress.current = 0
    }
    return progressPercent
  } else if (sessionStep === 'restart' || sessionStep === 'finished') {
    if (progressPercent !== 100) {
      setProgressPercent(100)
      prevSeenStepProgress.current = 100
    }
    return progressPercent
  } else if (sessionStage === 'error' || stepProgress == null) {
    return progressPercent
  }

  const stepAndStage = `${sessionStep}-${sessionStage}`

  // Accomodate for shell progress oddities.
  const isNewStateWithProgress =
    prevSeenUpdateStep.current !== stepAndStage &&
    stepProgress > 0 &&
    stepProgress < 100

  if (isNewStateWithProgress) {
    console.log('HITTING TRANSITION')
    currentStepWithProgress.current += 1
    console.log('CURRENT STEP PROGRESS', currentStepWithProgress.current)
    const completedStepsWithProgress =
      (100 * currentStepWithProgress.current) / TOTAL_STEPS_WITH_PROGRESS
    prevSeenStepProgress.current = 0
    prevSeenUpdateStep.current = stepAndStage
    setProgressPercent(completedStepsWithProgress + stepProgress)
  } else if (stepProgress > prevSeenStepProgress.current) {
    const currentStepProgress =
      progressPercent +
      (stepProgress - prevSeenStepProgress.current) / TOTAL_STEPS_WITH_PROGRESS
    const nonBacktrackedProgressPercent = Math.max(
      progressPercent,
      currentStepProgress
    )
    prevSeenStepProgress.current = stepProgress
    setProgressPercent(nonBacktrackedProgressPercent)
  }

  console.log(
    '🚀 ~ file: useRobotUpdateInfo.ts:143 ~ updateStep:',
    stepAndStage
  )
  console.log(
    '🚀 ~ file: useRobotUpdateInfo.ts:165 ~ prevSeenUpdateStep.current :',
    prevSeenUpdateStep.current
  )
  console.log(
    '🚀 ~ file: useRobotUpdateInfo.ts:114 ~ stepProgress:',
    stepProgress
  )
  console.log(
    '🚀 ~ file: useRobotUpdateInfo.ts:113 ~ prevSeenStepProgress:',
    prevSeenStepProgress
  )
  console.log(
    '🚀 ~ file: useRobotUpdateInfo.ts:115 ~ currentStepWithProgress:',
    currentStepWithProgress
  )

  return progressPercent
}
