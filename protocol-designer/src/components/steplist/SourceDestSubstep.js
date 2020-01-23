// @flow
import * as React from 'react'
import cx from 'classnames'

import { MultiChannelSubstep } from './MultiChannelSubstep'
import SubstepRow from './SubstepRow'
import styles from './StepItem.css'

import type {
  SourceDestSubstepItem,
  SubstepIdentifier,
  WellIngredientNames,
} from '../../steplist/types'

export type StepSubItemProps = {|
  substeps: SourceDestSubstepItem,
|}

type SourceDestSubstepProps = {|
  ...StepSubItemProps,
  ingredNames: WellIngredientNames,
  selectSubstep: SubstepIdentifier => mixed,
  hoveredSubstep: ?SubstepIdentifier,
|}

export function SourceDestSubstep(props: SourceDestSubstepProps) {
  const { substeps, selectSubstep, hoveredSubstep } = props
  if (substeps.multichannel) {
    // multi-channel row item (collapsible)
    return (
      <li>
        {substeps.multiRows.map((rowGroup, groupKey) => (
          <MultiChannelSubstep
            key={groupKey}
            rowGroup={rowGroup}
            stepId={substeps.parentStepId}
            substepIndex={groupKey}
            selectSubstep={selectSubstep}
            ingredNames={props.ingredNames}
            highlighted={
              !!hoveredSubstep &&
              hoveredSubstep.stepId === substeps.parentStepId &&
              hoveredSubstep.substepIndex === groupKey
            }
          />
        ))}
      </li>
    )
  }

  // single-channel row item
  return substeps.rows.map<React.Node>((row, substepIndex) => (
    <SubstepRow
      key={substepIndex}
      className={cx(styles.step_subitem, {
        [styles.highlighted]:
          !!hoveredSubstep &&
          hoveredSubstep.stepId === substeps.parentStepId &&
          substepIndex === hoveredSubstep.substepIndex,
      })}
      selectSubstep={selectSubstep}
      stepId={substeps.parentStepId}
      substepIndex={substepIndex}
      ingredNames={props.ingredNames}
      volume={row.volume}
      source={row.source}
      dest={row.dest}
    />
  ))
}
