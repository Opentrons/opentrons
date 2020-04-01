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

function Status(props: Props) {
  const { displayName } = props
  const iconName = 'check-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: true,
    [styles.failure]: false,
  })
  const message = `${displayName} connected`
  return (
    <div className={styles.leveling_title}>
      <Icon name={iconName} className={iconClass} />
      {message}
    </div>
  )
}

function ExitButton(props: Props) {
  const { exit } = props

  return (
    <PrimaryButton className={styles.confirm_button} onClick={exit}>
      {EXIT_BUTTON_MESSAGE}
    </PrimaryButton>
  )
}

export function LevelPipette(props: Props) {
  const { title, subtitle, displayName, back } = props
  return (
    <ModalPage
      titleBar={{
        title: title,
        subtitle: subtitle,
        back: { onClick: back, disabled: false },
      }}
    >
      <Status {...props} />
      <div className={styles.leveling_upper_spacer} />
      <div className={styles.leveling_instruction}>
        Next, level the {displayName}
      </div>
      <video width="100%" autoPlay={true} loop={true}>
        <source src={require('./videos/clouds.mp4')} type="video/mp4" />
      </video>
      <div className={styles.leveling_lower_spacer} />
      <ExitButton {...props} />
    </ModalPage>
  )
}
