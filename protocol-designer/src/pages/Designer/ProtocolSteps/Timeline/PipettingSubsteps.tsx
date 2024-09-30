import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { Substep } from './Substep'
import { MultichannelSubstep } from './MultichannelSubstep'
import type {
  SourceDestSubstepItem,
  SubstepIdentifier,
  WellIngredientNames,
} from '../../../../steplist'

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
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        {substeps.multiRows.map((rowGroup, groupKey) => (
          <MultichannelSubstep
            key={groupKey}
            highlighted={
              !!hoveredSubstep &&
              hoveredSubstep.stepId === substeps.parentStepId &&
              hoveredSubstep.substepIndex === groupKey
            }
            rowGroup={rowGroup}
            stepId={substeps.parentStepId}
            substepIndex={groupKey}
            selectSubstep={selectSubstep}
            ingredNames={props.ingredNames}
          />
        ))}
      </Flex>
    )
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      {substeps.rows.map((row, substepIndex) => (
        <Substep
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
