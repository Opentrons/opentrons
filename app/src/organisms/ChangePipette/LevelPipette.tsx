import * as React from 'react'
import cx from 'classnames'

import {
  Icon,
  ModalPage,
  PrimaryBtn,
  SecondaryBtn,
  SPACING_2,
} from '@opentrons/components'
import styles from './styles.css'

import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'

import type { Mount } from '../../redux/pipettes/types'
import type { PipetteOffsetCalibration } from '../../redux/calibration/types'

// TODO: i18n
const EXIT_BUTTON_MESSAGE = 'confirm pipette is leveled'
const EXIT_WITHOUT_CAL = 'exit without calibrating'
const CONTINUE_TO_PIP_OFFSET = 'continue to pipette offset calibration'
const LEVEL_MESSAGE = (displayName: string): string =>
  `Next, level the ${displayName}`
const CONNECTED_MESSAGE = (displayName: string): string =>
  `${displayName} connected`

interface Props {
  robotName: string
  mount: Mount
  title: string
  subtitle: string
  wantedPipette: PipetteNameSpecs | null
  actualPipette: PipetteModelSpecs | null
  actualPipetteOffset: PipetteOffsetCalibration | null
  displayName: string
  displayCategory: PipetteDisplayCategory | null
  pipetteModelName: string
  back: () => unknown
  exit: () => unknown
  startPipetteOffsetCalibration: () => void
}

function Status(props: { displayName: string }): JSX.Element {
  const iconName = 'check-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: true,
    [styles.failure]: false,
  })

  return (
    <div className={styles.leveling_title}>
      <Icon name={iconName} className={iconClass} />
      {CONNECTED_MESSAGE(props.displayName)}
    </div>
  )
}

function LevelingInstruction(props: { displayName: string }): JSX.Element {
  return (
    <div className={styles.leveling_instruction}>
      {LEVEL_MESSAGE(props.displayName)}
    </div>
  )
}

function LevelingVideo(props: {
  pipetteName: string
  mount: Mount
}): JSX.Element {
  const { pipetteName, mount } = props
  return (
    <div className={styles.leveling_video_wrapper}>
      <video
        className={styles.leveling_video}
        autoPlay={true}
        loop={true}
        controls={true}
      >
        <source
          src={require(`../../assets/videos/pip-leveling/${pipetteName}-${mount}.webm`)}
        />
      </video>
    </div>
  )
}

export function LevelPipette(props: Props): JSX.Element {
  const {
    title,
    subtitle,
    pipetteModelName,
    displayName,
    actualPipetteOffset,
    mount,
    back,
    exit,
    startPipetteOffsetCalibration,
  } = props

  return (
    <ModalPage
      titleBar={{
        title: title,
        subtitle: subtitle,
        back: { onClick: back, disabled: false },
      }}
      contentsClassName={styles.leveling_modal}
    >
      <Status displayName={displayName} />
      <LevelingInstruction displayName={displayName} />
      <LevelingVideo pipetteName={pipetteModelName} mount={mount} />
      {!actualPipetteOffset && (
        <PrimaryBtn
          marginBottom={SPACING_2}
          width="100%"
          onClick={startPipetteOffsetCalibration}
        >
          {CONTINUE_TO_PIP_OFFSET}
        </PrimaryBtn>
      )}
      <SecondaryBtn marginBottom={SPACING_2} width="100%" onClick={exit}>
        {actualPipetteOffset ? EXIT_BUTTON_MESSAGE : EXIT_WITHOUT_CAL}
      </SecondaryBtn>
    </ModalPage>
  )
}
