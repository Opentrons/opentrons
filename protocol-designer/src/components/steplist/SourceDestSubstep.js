// @flow
import cx from 'classnames'
import * as React from 'react'

import type {
  SourceDestSubstepItem,
  SubstepIdentifier,
  WellIngredientNames,
} from '../../steplist/types'
import { MultiChannelSubstep } from './MultiChannelSubstep'
import styles from './StepItem.css'
import { SubstepRow } from './SubstepRow'

export type StepSubItemProps = {|
  substeps: SourceDestSubstepItem,
|}

type SourceDestSubstepProps = {|
  ...StepSubItemProps,
  ingredNames: WellIngredientNames,
  selectSubstep: SubstepIdentifier => mixed,
  hoveredSubstep: ?SubstepIdentifier,
|}

export function SourceDestSubstep(props: SourceDestSubstepProps): React.Node {
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
