// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {Mount} from '../../robot'
import type {ChangePipetteProps, Channels} from './types'
import PIPETTES from './pipettes'
import {PrimaryButton, ModalPage} from '@opentrons/components'
import PipetteSelection from './PipetteSelection'
import InstructionStep from './InstructionStep'
import styles from './styles.css'

export default function AttachPipette (props: ChangePipetteProps) {
  const {mount, pipette, exitUrl, back, onPipetteSelect, confirmPipette} = props

  const titleBar = {
    ...props,
    back: props.pipette
      ? {onClick: back}
      : {Component: Link, to: exitUrl}
  }

  return (
    <ModalPage titleBar={titleBar} contentsClassName={styles.modal_contents}>
      <AttachPipetteTitle name={pipette && pipette.name} />

      {!pipette && (
        <PipetteSelection
          options={PIPETTES.map(p => ({...p, value: p.model}))}
          onChange={onPipetteSelect}
        />
      )}

      {pipette && (
        <div>
          <AttachPipetteInstructions
            mount={mount}
            channels={pipette.channels}
          />
          <CheckPipettesButton onClick={confirmPipette} />
        </div>
      )}
    </ModalPage>
  )
}

function AttachPipetteTitle (props: {name: ?string}) {
  return (
    <h3 className={styles.attach_pipette_title}>
      Attach {props.name || ''} Pipette
    </h3>
  )
}

function AttachPipetteInstructions (props: {mount: Mount, channels: Channels}) {
  return (
    <div className={styles.instructions}>
      <InstructionStep
        step='one'
        direction='attach'
        diagram='screws'
        {...props}
      >
        Attach pipette to carriage, <strong>starting with screw 1</strong>.
      </InstructionStep>
      <InstructionStep
        step='two'
        direction='attach'
        diagram='tab'
        {...props}
      >
        Connect the pipette to robot by pushing in the white connector tab.
      </InstructionStep>
    </div>
  )
}

function CheckPipettesButton (props: {onClick: () => mixed}) {
  return (
    <PrimaryButton
      onClick={props.onClick}
      className={styles.check_pipette_button}
    >
      have robot check connection
    </PrimaryButton>
  )
}
