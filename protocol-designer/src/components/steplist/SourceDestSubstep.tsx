import * as React from 'react'
import cx from 'classnames'

import { MultiChannelSubstep } from './MultiChannelSubstep'
import { SubstepRow } from './SubstepRow'
import styles from './StepItem.module.css'

import {
  SourceDestSubstepItem,
  SubstepIdentifier,
  WellIngredientNames,
} from '../../steplist/types'

export interface StepSubItemProps {
  substeps: SourceDestSubstepItem
}

type SourceDestSubstepProps = StepSubItemProps & {
  ingredNames: WellIngredientNames
  selectSubstep: (substepIdentifier: SubstepIdentifier) => unknown
  hoveredSubstep?: SubstepIdentifier | null
}

export function SourceDestSubstep(props: SourceDestSubstepProps): JSX.Element {
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
  // @ts-expect-error(sa, 2021-6-21): TODO: make this return a fragment instead of a list of JSX elements
  return substeps.rows.map<JSX.Element>((row, substepIndex) => (
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
