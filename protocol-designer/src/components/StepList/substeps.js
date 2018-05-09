// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '@opentrons/components'

import type {StepItemsWithSubsteps, SubstepIdentifier, StepSubItemData} from '../../steplist/types'
import type {LabwareData} from '../../step-generation'

import SourceDestSubstep from './SourceDestSubstep'
import styles from './StepItem.css'

type SubstepItemsProps = {
  substeps: ?StepSubItemData,
  onSelectSubstep: (SubstepIdentifier) => mixed,
  hoveredSubstep: SubstepIdentifier
}

type AllLabware = {[labwareId: string]: LabwareData}

export function SubstepItems (props: SubstepItemsProps) {
  const {substeps, onSelectSubstep, hoveredSubstep} = props

  if (!substeps) {
    // no substeps, form is probably not finished (or it's "deck-setup" stepType)
    return null
  }

  if (substeps.stepType === 'transfer' ||
    substeps.stepType === 'consolidate' ||
    substeps.stepType === 'distribute' ||
    substeps.stepType === 'mix'
  ) {
    // all these step types share the same substep display
    return <SourceDestSubstep
      substeps={substeps}
      hoveredSubstep={hoveredSubstep}
      onSelectSubstep={onSelectSubstep} // TODO use action
    />
  }

  if (substeps.stepType === 'pause') {
    if (substeps.wait === true) {
      // Show message if waiting indefinitely
      return <li>{substeps.message}</li>
    }
    if (!substeps.meta) {
      // No message or time, show nothing
      return null
    }
    const {hours, minutes, seconds} = substeps.meta
    return <li>{hours} hr {minutes} m {seconds} s</li>
  }

  return <li>TODO: substeps for {substeps.stepType}</li>
}

function getLabwareName (labwareId: ?string, labware: AllLabware): ?string {
  return labwareId && labware[labwareId] && labware[labwareId].name
}

export function generateHeaders (step: StepItemsWithSubsteps, labware: AllLabware) {
  const formData = step.formData
  if (!formData) {
    return
  }

  if (formData.stepType === 'mix') {
    return <li className={styles.step_subitem}>
      <span className={styles.emphasized_cell}>{getLabwareName(formData.labware, labware)}</span>
      <span>{formData.volume} uL</span>
      <span>{formData.times}x</span>
    </li>
  }

  if (
    formData.stepType === 'consolidate' ||
    formData.stepType === 'distribute' ||
    formData.stepType === 'transfer'
  ) {
    const sourceLabwareName = getLabwareName(formData['aspirate--labware'], labware)
    const destLabwareName = getLabwareName(formData['dispense--labware'], labware)
    if (!sourceLabwareName || !destLabwareName) {
      return
    }

    return [
      <li key='header-0' className={styles.aspirate_dispense}>
          <span>ASPIRATE</span>
          <span className={styles.spacer}/>
          <span>DISPENSE</span>
      </li>,

      <li key='header-1' className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}>
        <span>{sourceLabwareName}</span>
        {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
        <Icon name='ot-transfer' />
        <span>{destLabwareName}</span>
      </li>
    ]
  }
}
