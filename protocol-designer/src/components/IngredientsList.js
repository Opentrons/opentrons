// @flow
import React from 'react'

import {IconButton, SidePanel, TitledList} from '@opentrons/components'
import stepItemStyles from './steplist/StepItem.css'
import StepDescription from './StepDescription'
import {swatchColors} from '../constants.js'
import styles from './IngredientsList.css'
import type {IngredGroupForLabware} from '../labware-ingred/types'
import type {SingleLabwareLiquidState} from '../step-generation'

type DeleteIngredient = (args: {|groupId: string, wellName?: string|}) => mixed
type EditModeIngredientGroup = (args: {|groupId: string, wellName: ?string|}) => mixed

// Props used by both IngredientsList and IngredGroupCard // TODO
type CommonProps = {|
  editModeIngredientGroup: EditModeIngredientGroup,
  deleteIngredient: DeleteIngredient,
  selected?: boolean
|}

type CardProps = {|
  ingredGroup: IngredGroupForLabware,
  ...CommonProps
|}

type CardState = {|
  isExpanded: boolean
|}

class IngredGroupCard extends React.Component<CardProps, CardState> {
  constructor (props: CardProps) {
    super(props)
    this.state = {isExpanded: true} // TODO: rename to 'collapsed'
  }

  toggleAccordion = () => this.setState({isExpanded: !this.state.isExpanded})

  render () {
    const {ingredGroup, editModeIngredientGroup, deleteIngredient, selected} = this.props
    const { groupId, serializeName, individualize, description, name, wells } = ingredGroup
    const { isExpanded } = this.state

    return (
      <TitledList
        title={name || 'Unnamed Ingredient'}
        className={styles.ingredient_titled_list}
        iconProps={{style: {fill: swatchColors(parseInt(groupId))}}}
        iconName='circle'
        onCollapseToggle={() => this.toggleAccordion()}
        collapsed={!isExpanded}
        selected={selected}
        onClick={() => editModeIngredientGroup({groupId, wellName: null})}
        description={<StepDescription description={description} header='Description:' />}
      >
        <div className={styles.ingredient_row_header}>
          <span>Well</span>
          <span>Volume</span>
          <span>Name</span>
          <span />
        </div>
        {Object.keys(wells).map((well, i) => { // TODO sort keys
          const {volume} = wells[well]
          return <IngredIndividual key={well}
            name={individualize
              ? `${serializeName || 'Sample'} ${i + 1}` // TODO IMMED SORT AND NUMBER
              : ''
            }
            wellName={well}
            canDelete
            volume={volume}
            // concentration={get(ingredCategoryData, ['wellDetails', wellName, 'concentration'], ingredCategoryData.concentration)}
            groupId={groupId}
            editModeIngredientGroup={editModeIngredientGroup}
            deleteIngredient={deleteIngredient}
          />
        })}
      </TitledList>
    )
  }
}

type IndividProps = {|
  name: string,
  wellName: string,
  volume: number,
  // concentration?: string,
  canDelete: boolean,
  groupId: string,
  editModeIngredientGroup: EditModeIngredientGroup,
  deleteIngredient: DeleteIngredient
|}

function IngredIndividual (props: IndividProps) {
  const {
    name,
    wellName,
    volume,
    // concentration, // TODO LATER Ian 2018-02-22: concentration is removed from MVP. Remove all traces of it, or add it back in
    canDelete,
    groupId,
    deleteIngredient
  } = props

  return (
    <div
      className={styles.ingredient_row}
    >
      <div>{wellName}</div>
      <div>{volume ? volume + ' μL' : '-'}</div>
      <div>{name}</div>
      {canDelete && <IconButton name='close'
        onClick={
          () => window.confirm(`Are you sure you want to delete well ${wellName} ?`) &&
          deleteIngredient({wellName, groupId})
        } />}
    </div>
  )
}

type Props = {
  ...CommonProps,
  ingredients: ?SingleLabwareLiquidState,
  selectedIngredientGroupId: string | null,
  renameLabwareFormMode: boolean,
  openRenameLabwareForm: () => mixed
}

export default function IngredientsList (props: Props) {
  const {
    ingredients,
    editModeIngredientGroup,
    deleteIngredient,
    selectedIngredientGroupId,
    renameLabwareFormMode,
    openRenameLabwareForm
  } = props

  return (
    <SidePanel title='Ingredients'>
        {/* Labware Name "button" to open LabwareNameEditForm */}
        <TitledList
          className={stepItemStyles.step_item}
          title='labware name'
          iconName='flask-outline'
          selected={renameLabwareFormMode}
          onClick={openRenameLabwareForm}
        />

        {/* TODO IMMEDIATELY: fix the cards. they can't go thru ingredients keys! */}
        {false && ingredients && Object.keys(ingredients).map((i) =>
          <IngredGroupCard key={i}
            editModeIngredientGroup={editModeIngredientGroup}
            deleteIngredient={deleteIngredient}
            ingredGroup={ingredients[i]}
            selected={selectedIngredientGroupId === ingredients[i].groupId}
          />)
        }
    </SidePanel>
  )
}
