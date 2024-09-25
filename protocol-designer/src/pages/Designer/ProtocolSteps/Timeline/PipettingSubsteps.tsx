import * as React from 'react'
import {
  SourceDestSubstepItem,
  SubstepIdentifier,
  WellIngredientNames,
} from '../../../../steplist'
import { MultiChannelSubstep } from '../../../../components/steplist/MultiChannelSubstep'
import { SubstepRow } from '../../../../components/steplist/SubstepRow'
import { Substep } from './Substep'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

interface PipettingSubstepsProps {
  substeps: SourceDestSubstepItem
  ingredNames: WellIngredientNames
  selectSubstep: (substepIdentifier: SubstepIdentifier) => void
  hoveredSubstep?: SubstepIdentifier | null
}

export function PipettingSubsteps(props: PipettingSubstepsProps): JSX.Element {
  const { substeps, selectSubstep, hoveredSubstep } = props
  if (substeps.multichannel) {
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
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      {substeps.rows.map((row, substepIndex) => (
        <SubstepRow
          key={substepIndex}
          selectSubstep={selectSubstep}
          stepId={substeps.parentStepId}
          substepIndex={substepIndex}
          ingredNames={props.ingredNames}
          volume={row.volume}
          source={row.source}
          dest={row.dest}
        />
      ))}
    </Flex>
  )
}
