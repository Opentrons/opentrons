import { useSelector } from 'react-redux'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import {
  getAdditionalEquipment,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'

import { MultichannelSubstep } from './MultichannelSubstep'
import { Substep } from './Substep'

import type { ReactNode } from 'react'
import type {
  SourceDestSubstepItem,
  SubstepIdentifier,
} from '/protocol-designer/steplist'

interface PipettingSubstepsProps {
  substeps: SourceDestSubstepItem
  selectSubstep: (substepIdentifier: SubstepIdentifier) => void
  hoveredSubstep?: SubstepIdentifier | null
}

export function PipettingSubsteps(props: PipettingSubstepsProps): ReactNode {
  const { substeps, selectSubstep, hoveredSubstep } = props
  const stepId = substeps.parentStepId
  const formData = useSelector(getSavedStepForms)[stepId]
  const additionalEquipment = useSelector(getAdditionalEquipment)

  const destLocationId = formData.dispense_labware
  const trashName =
    additionalEquipment[destLocationId] != null
      ? additionalEquipment[destLocationId]?.name
      : null

  const isSameLabware = formData.aspirate_labware === destLocationId
  const renderSubsteps = substeps.multichannel
    ? substeps.multiRows.map((rowGroup, groupKey) => {
        return (
          <MultichannelSubstep
            trashName={trashName}
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
            isSameLabware={isSameLabware}
          />
        )
      })
    : substeps.rows.map((row, substepIndex) => (
        <Substep
          isNested={false}
          trashName={trashName}
          key={substepIndex}
          selectSubstep={selectSubstep}
          stepId={substeps.parentStepId}
          substepIndex={substepIndex}
          volume={row.volume}
          aspirateVolume={row.aspirateVolume}
          dispenseVolume={row.dispenseVolume}
          source={row.source}
          dest={row.dest}
          isSameLabware={isSameLabware}
        />
      ))

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      {renderSubsteps}
    </Flex>
  )
}
