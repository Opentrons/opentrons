// @flow
import * as React from 'react'
import isNil from 'lodash/isNil'
import pick from 'lodash/pick'
import {SidePanel, TitledList} from '@opentrons/components'

// import type {StepItemProps} from '../components/StepItem'
import StepItem from '../components/StepItem'
// import type {StepSubItemProps} from '../components/StepSubItem'
import StepSubItem from '../components/StepSubItem'
import StepCreationButton from '../containers/StepCreationButton'

import styles from '../components/StepItem.css' // TODO: Ian 2018-01-11 This is just for "Labware & Ingredient Setup" right now, can remove later

// TODO move types to a place where React can import them
// and also add them into StepSubItem and StepItem props types.
type StepSubItemData = {
  sourceIngredientName?: string,
  destIngredientName?: string,
  sourceWell?: string,
  destWell?: string,
}

type StepItemData = {
  id: number,
  title: string,
  stepType: string, // TODO should be union string literal
  substeps: Array<StepSubItemData>,
  description?: string,
  sourceLabwareName?: string,
  destLabwareName?: string
}

type StepListProps = {
  selectedStep?: number,
  steps: Array<StepItemData>,
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
          selected={!isNil(props.selectedStep) && step.id === props.selectedStep}
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
          {step && step.substeps && step.substeps.map((substep, key) =>
            <StepSubItem {...pick(substep, [
              'sourceIngredientName',
              'sourceWell',
              'destIngredientName',
              'destWell'
            ])} />
          )}
        </StepItem>
      ))}

      <StepCreationButton />
    </SidePanel>
  )
}
