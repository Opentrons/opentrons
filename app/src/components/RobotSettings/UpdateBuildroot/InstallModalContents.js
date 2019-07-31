// @flow
import * as React from 'react'
import { ProgressSpinner, ProgressBar } from './progress'
import styles from './styles.css'
import type { BuildrootUpdateSession, RobotSystemType } from '../../../shell'
type Props = {
  robotSystemType: RobotSystemType | null,
  session: BuildrootUpdateSession,
}
export default function InstallModalContents(props: Props) {
  const {
    robotSystemType,
    session: { step: updateStep, progress, error },
  } = props
  const prevStep = usePrevious(updateStep)
  const step = updateStep || prevStep

  let title: string
  let restartMessage: string

  if (robotSystemType === 'balena') {
    if (step === 'premigration') {
      title = 'Robot server update in progress…'
      restartMessage =
        'Your OT-2 will reboot once robot server update is complete.'
    } else if (
      step === 'premigrationRestart' ||
      step === 'restart' ||
      step === 'restarting'
    ) {
      title = 'Robot is restarting...'
      restartMessage =
        'Robot update process will continue once robot restart is complete.'
    } else {
      title = 'Robot system update in progress…'
      restartMessage =
        'Your OT-2 will reboot once robot system update is complete.'
    }
  } else if (robotSystemType === 'buildroot') {
    if (step === 'restart' || step === 'restarting') {
      title = 'Robot is restarting...'
      restartMessage =
        'Robot update process will continue once robot restart is complete.'
    } else {
      title = 'Robot update in progress…'
      restartMessage = 'Your OT-2 will reboot once robot update is complete.'
    }
  }

  const progressComponent =
    step === 'processFile' || step === 'commitUpdate' ? (
      <ProgressBar progress={progress} />
    ) : (
      <ProgressSpinner />
    )

  if (error !== null) {
    return (
      <div className={styles.system_update_modal}>
        <p className={styles.update_title}>
          An error occured while updating your robot:
        </p>
        <p className={styles.update_message}>{error}</p>
      </div>
    )
  }
  return (
    <div className={styles.system_update_modal}>
      {step === 'finished' ? (
        <p>Your robot is now succesfully updated.</p>
      ) : (
        <>
          <p className={styles.update_title}>{title}</p>
          {progressComponent}
          <p className={styles.update_message}>
            {step && UPDATE_MESSAGE[step]}
          </p>
          <p>{restartMessage}</p>
        </>
      )}
    </div>
  )
}

function usePrevious(value) {
  const ref = React.useRef()
  React.useEffect(() => {
    ref.current = value
  })
  return ref.current
}

const UPDATE_MESSAGE = {
  premigration: 'Hang tight! This may take about 3-5 minutes.',
  premigrationRestart: 'Hang tight! This may take about 3-5 minutes.',
  getToken: 'Sending update file to robot',
  uploadFile: 'Sending update file to robot',
  processFile: 'Applying update to robot',
  commitUpdate: 'Applying update to robot',
  restart: 'Hang tight! This may take about 3-5 minutes.',
  restarting: 'Hang tight! This may take about 3-5 minutes.',
  finished: null,
}
