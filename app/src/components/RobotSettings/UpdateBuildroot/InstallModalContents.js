// @flow
import * as React from 'react'

import { usePrevious } from '@opentrons/components'
import { ProgressSpinner, ProgressBar } from './progress'
import styles from './styles.css'

import type {
  BuildrootUpdateSession,
  RobotSystemType,
} from '../../../buildroot/types'

type Props = {|
  robotSystemType: RobotSystemType | null,
  session: BuildrootUpdateSession,
|}

export default function InstallModalContents(props: Props) {
  const { robotSystemType, session } = props
  const { step: updateStep, progress, error } = session
  const prevStep = usePrevious(updateStep)
  const step = updateStep || prevStep

  let title: string
  let restartMessage: string
  let updateMessage: string | null = null

  if (error !== null) {
    return (
      <div className={styles.system_update_modal}>
        <p className={styles.update_title}>
          An error occurred while updating your robot:
        </p>
        <p className={styles.update_message}>{error}</p>
      </div>
    )
  }

  if (step === 'premigration') {
    title = 'Robot server update in progress…'
    restartMessage =
      'Your OT-2 will reboot once robot server update is complete.'
  } else if (step === 'premigrationRestart') {
    title = 'Robot is restarting...'
    restartMessage =
      'Robot update process will continue once robot restart is complete.'
  } else if (step === 'restart' || step === 'restarting') {
    title = 'Robot is restarting...'
    restartMessage = 'Waiting for robot to restart to complete update'
  } else {
    title = `Robot ${
      robotSystemType === 'balena' ? 'system ' : ''
    } update in progress…`
    restartMessage = 'Your OT-2 will restart once the update is complete.'
  }

  if (
    step === 'premigration' ||
    step === 'premigrationRestart' ||
    step === 'restart' ||
    step === 'restarting'
  ) {
    updateMessage = 'Hang tight! This may take up to 3 minutes.'
  } else if (step === 'getToken' || step === 'uploadFile') {
    updateMessage = 'Sending update file to robot'
  } else if (
    step === 'processFile' &&
    (session.stage === 'awaiting-file' || session.stage === 'validating')
  ) {
    updateMessage = 'Validating update file'
  } else if (step === 'processFile' || step === 'commitUpdate') {
    updateMessage = 'Applying update to robot'
  }

  const progressComponent =
    step === 'processFile' || step === 'commitUpdate' ? (
      <ProgressBar key={step} progress={progress} />
    ) : (
      <ProgressSpinner />
    )

  return (
    <div className={styles.system_update_modal}>
      {step === 'finished' ? (
        <p>Your robot is now successfully updated.</p>
      ) : (
        <>
          <p className={styles.update_title}>{title}</p>
          {progressComponent}
          <p className={styles.update_message}>{updateMessage}</p>
          <p>{restartMessage}</p>
        </>
      )}
    </div>
  )
}
