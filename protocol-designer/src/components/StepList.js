// @flow
import * as React from 'react'
import isNil from 'lodash/isNil'
import pick from 'lodash/pick'
import {SidePanel, TitledList} from '@opentrons/components'

import type {StepItemData, StepSubItemData} from '../steplist/types'
import StepItem from '../components/StepItem'
import StepSubItem from '../components/StepSubItem'
import StepCreationButton from '../containers/StepCreationButton'

import styles from '../components/StepItem.css' // TODO: Ian 2018-01-11 This is just for "Labware & Ingredient Setup" right now, can remove later

type StepListProps = {
  selectedStepId?: number,
  steps: Array<StepItemData & {substeps?: Array<StepSubItemData>}>,
  handleStepItemClickById?: number => (event?: SyntheticEvent<>) => void,
  handleStepItemCollapseToggleById?: number => (event?: SyntheticEvent<>) => void
}

export default function StepList (props: StepListProps) {
  return (
    <SidePanel title='Protocol Step List'>

      {/* TODO: Ian 2018-01-16 figure out if 'Labware & Ingred Setup' is a Step or something else... */}
      <TitledList className={styles.step_item} iconName='flask' title='Labware & Ingredient Setup' />

      {props.steps && props.steps.map((step, key) => (
        <StepItem key={key}
          onClick={props.handleStepItemClickById && props.handleStepItemClickById(step.id)}
          onCollapseToggle={props.handleStepItemCollapseToggleById && props.handleStepItemCollapseToggleById(step.id)}
          selected={!isNil(props.selectedStepId) && step.id === props.selectedStepId}
          {...pick(step, [
            'title',
            'stepType',
            'sourceLabwareName',
            'sourceWell',
            'destLabwareName',
            'destWell',
            'description',
            'collapsed'
          ])}
        >
          {step.substeps && step.substeps.map((substep: StepSubItemData, subkey) => // TODO
            <StepSubItem key={subkey} {...substep} />
          )}
        </StepItem>
      ))}

      <StepCreationButton />
    </SidePanel>
  )
}
