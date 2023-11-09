import * as React from 'react'
import { useSelector } from 'react-redux'

import { getRobotUpdateDownloadProgress } from '../../../../redux/robot-update'

import type { RobotUpdateSession } from '../../../../redux/robot-update/types'
import type { State } from '../../../../redux/types'

export function useRobotUpdateInfo(
  robotName: string,
  session: RobotUpdateSession | null
): { updateStep: UpdateStep | null; progressPercent: number } {
  const progressPercent = useFindProgressPercentFrom(robotName, session)

  const updateStep = React.useMemo(() => determineUpdateStepFrom(session), [
    session,
  ])

  return {
    updateStep,
    progressPercent,
  }
}

function useFindProgressPercentFrom(
  robotName: string,
  session: RobotUpdateSession | null
): number {
  const [progressPercent, setProgressPercent] = React.useState<number>(0)
  const hasSeenDownloadFileStep = React.useRef<boolean>(false)
  const prevSeenUpdateStep = React.useRef<string | null>(null)
  const prevSeenStepProgress = React.useRef<number>(0)
  const currentStepWithProgress = React.useRef<number>(-1)

  const downloadProgress = useSelector((state: State) =>
    getRobotUpdateDownloadProgress(state, robotName)
  )

  if (session == null) {
    if (progressPercent !== 0) {
      setProgressPercent(0)
      prevSeenStepProgress.current = 0
      hasSeenDownloadFileStep.current = false
    }
    return progressPercent
  }

  let {
    step: sessionStep,
    stage: sessionStage,
    progress: stepProgress,
  } = session

  if (sessionStep == null && sessionStage == null) {
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
  } else if (sessionStage === 'error') {
    return progressPercent
  }

  const stepAndStage = `${sessionStep}-${sessionStage}`
  // Ignored because 0-100 is too fast to be worth recording or currently unsupported.
  const IGNORED_STEPS_AND_STAGES = [
    'processFile-awaiting-file',
    'uploadFile-awaiting-file',
  ]

  if (sessionStep === 'downloadFile') {
    hasSeenDownloadFileStep.current = true
    stepProgress = downloadProgress
  }

  stepProgress = stepProgress ?? 0

  // Each stepAndStage is an equal fraction of the total steps.
  const TOTAL_STEPS_WITH_PROGRESS = hasSeenDownloadFileStep.current ? 3 : 2

  const isNewStateWithProgress =
    prevSeenUpdateStep.current !== stepAndStage &&
    stepProgress > 0 && // Accommodate for shell progress oddities.
    stepProgress < 100

  // Proceed to next fraction of progress bar.
  if (
    isNewStateWithProgress &&
    !IGNORED_STEPS_AND_STAGES.includes(stepAndStage)
  ) {
    currentStepWithProgress.current += 1
    const completedStepsWithProgress =
      (100 * currentStepWithProgress.current) / TOTAL_STEPS_WITH_PROGRESS
    prevSeenStepProgress.current = 0
    prevSeenUpdateStep.current = stepAndStage
    setProgressPercent(completedStepsWithProgress)
  }
  // Proceed with current fraction of progress bar.
  else if (
    stepProgress > prevSeenStepProgress.current &&
    !IGNORED_STEPS_AND_STAGES.includes(stepAndStage)
  ) {
    const currentStepProgress =
      (stepProgress - prevSeenStepProgress.current) / TOTAL_STEPS_WITH_PROGRESS

    const nonBacktrackedProgressPercent = Math.max(
      progressPercent,
      currentStepProgress + progressPercent
    )

    prevSeenStepProgress.current = stepProgress
    setProgressPercent(nonBacktrackedProgressPercent)
  }

  return progressPercent
}

export type UpdateStep =
  | 'initial'
  | 'download'
  | 'install'
  | 'restart'
  | 'finished'
  | 'error'

function determineUpdateStepFrom(
  session: RobotUpdateSession | null
): UpdateStep | null {
  if (session == null) return null
  const { step: sessionStep, stage: sessionStage, error } = session

  let reportedUpdateStep: UpdateStep
  if (error != null) {
    reportedUpdateStep = 'error'
  } else if (sessionStep == null && sessionStage == null) {
    reportedUpdateStep = 'initial'
  } else if (sessionStep === 'downloadFile') {
    reportedUpdateStep = 'download'
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
