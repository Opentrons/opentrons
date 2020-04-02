// @flow

import * as React from 'react'
import cx from 'classnames'

import { Icon, ModalPage, PrimaryButton } from '@opentrons/components'
import styles from './styles.css'

import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'

import type { Mount } from '../../pipettes/types'

const EXIT_BUTTON_MESSAGE = 'confirm pipette is leveled'

type Props = {|
  robotName: string,
  mount: Mount,
  title: string,
  subtitle: string,
  wantedPipette: PipetteNameSpecs | null,
  actualPipette: PipetteModelSpecs | null,
  displayName: string,
  displayCategory: PipetteDisplayCategory | null,
  back: () => mixed,
  exit: () => mixed,
|}

function Status(props: { pipetteName: string }) {
  const iconName = 'check-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: true,
    [styles.failure]: false,
  })
  const message = `${props.pipetteName} connected`
  return (
    <div className={styles.leveling_title}>
      <Icon name={iconName} className={iconClass} />
      {message}
    </div>
  )
}

function ExitButton(props: { exit: () => mixed }) {
  return (
    <PrimaryButton className={styles.confirm_button} onClick={props.exit}>
      {EXIT_BUTTON_MESSAGE}
    </PrimaryButton>
  )
}

function LevelingInstruction(props: { pipetteName: string }) {
  return (
    <div className={styles.leveling_instruction}>
      Next, level the {props.pipetteName}
    </div>
  )
}

function LevelingVideo() {
  return (
    <div className={styles.leveling_video_wrapper}>
      <video width="100%" autoPlay={true} loop={true}>
        <source src={require('./videos/calibration.webm')} />
      </video>
    </div>
  )
}

export function LevelPipette(props: Props) {
  const { title, subtitle, displayName, back, exit } = props
  return (
    <ModalPage
      titleBar={{
        title: title,
        subtitle: subtitle,
        back: { onClick: back, disabled: false },
      }}
      contentsClassName={styles.leveling_modal}
    >
      <Status pipetteName={displayName} />
      <LevelingInstruction pipetteName={displayName} />
      <LevelingVideo />
      <ExitButton exit={exit} />
    </ModalPage>
  )
}
