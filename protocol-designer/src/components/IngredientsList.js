// @flow
import React from 'react'
import get from 'lodash/get'

import styles from './IngredientsList.css'
import { swatchColors } from '../constants.js'
import { humanize } from '../utils.js'

type DeleteIngredient = (args: {wellName: string, groupId: string}) => void // TODO get from action type?
type EditModeIngredientGroup = (args: {groupId: string}) => void

// Props used by both IngredientsList and IngredGroupCard // TODO
type CommonProps = {|
  editModeIngredientGroup: EditModeIngredientGroup,
  deleteIngredient: DeleteIngredient,
  selected: boolean
|}

type IngredCategoryData = {|
  groupId: string,

  name: string,
  wells: Array<string>,
  individualize: boolean,
  serializeName: string,

  volume?: number,
  concentration?: string,

  wellDetails: {
    [wellName: string]: {
      name: string,
      volume: number,
      concentration: string
    }
  }
|}

type CardProps = {|
  ingredCategoryData: IngredCategoryData,
  ...CommonProps
  // otherprops?
|}

type CardState = {|
  isExpanded: boolean
|}

class IngredGroupCard extends React.Component<CardProps, CardState> {
  constructor (props: CardProps) {
    super(props)
    this.state = {isExpanded: true}
  }

  toggleAccordion = () => this.setState({isExpanded: !this.state.isExpanded})

  render () {
    const {ingredCategoryData, editModeIngredientGroup, deleteIngredient, selected, ...otherProps} = this.props
    const { groupId, serializeName } = ingredCategoryData
    const { isExpanded } = this.state

    return (
      <section {...otherProps} className={selected && styles.selected}>
        <label>
          <div onClick={() => this.toggleAccordion()} className={styles.arrow_dropdown}>{isExpanded ? '▼' : '►'}</div>
          <div className={styles.circle} style={{backgroundColor: swatchColors(parseInt(groupId))}} />
          <div className={styles.ingred_label}>{ingredCategoryData.name}</div>
          {/* <div>{ingredCategoryData.wells.length} Wells</div> */}
          <div className={styles.edit_button} onClick={() => editModeIngredientGroup({groupId})}>EDIT</div>
        </label>

        {isExpanded && ingredCategoryData.wells.map((wellName, i) =>
          <IngredIndividual key={i}
            name={ingredCategoryData.individualize
              ? get(ingredCategoryData, ['wellDetails', wellName, 'name'], `${serializeName || 'Sample'} ${i + 1}`)
              : ' '
            }
            wellName={wellName}
            canDelete
            volume={get(ingredCategoryData, ['wellDetails', wellName, 'volume'], ingredCategoryData.volume)}
            concentration={get(ingredCategoryData, ['wellDetails', wellName, 'concentration'], ingredCategoryData.concentration)}
            groupId={groupId}
            editModeIngredientGroup={editModeIngredientGroup}
            deleteIngredient={deleteIngredient}
          />
        )}
      </section>
    )
  }
}

type IndividProps = {|
  name: string,
  wellName: string,
  volume: number,
  concentration?: string,
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
    concentration,
    canDelete,
    groupId,
    editModeIngredientGroup,
    deleteIngredient,
    ...otherProps
  } = props

  return (
    <div {...otherProps}
      className={styles.ingredient_instance_item}
      style={{'--swatch-color': swatchColors(parseInt(groupId))}}
    >
      <div>{wellName}</div>
      <div>{name}</div>
      <div>{volume ? volume + 'uL' : '-'}</div>
      {/* <button className={styles.edit_button} onClick={e => editModeIngredientGroup({wellName, groupId})}>EDIT</button> */}
      <div>{concentration === null ? '-' : concentration}</div>
      {canDelete && <div className={styles.delete_ingredient} onClick={
          () => window.confirm(`Are you sure you want to delete well ${wellName} ?`) &&
          deleteIngredient({wellName, groupId})
        }>✕</div>}
    </div>
  )
}

type ListProps = {|
  slot: string,
  containerName: string,
  containerType: string,
  ingredients: Array<IngredCategoryData>,
  selectedIngredientGroupId: string,
  ...CommonProps
|}

export default function IngredientsList (props: ListProps) {
  const {
    slot,
    containerName,
    containerType,
    ingredients,
    editModeIngredientGroup,
    deleteIngredient,
    selectedIngredientGroupId
  } = props

  return (
    <div className={styles.ingredients_list}>
      <div className={styles.ingred_list_header_label}>
        <div className={styles.flex_row}>
          <div>Slot {slot}</div>
          <div className={styles.container_type}>{humanize(containerType)}</div>
        </div>
        <div className={styles.container_name}>{containerName}</div>
      </div>

      {ingredients.map((ingredCategoryData, i) =>
        <IngredGroupCard key={i}
          editModeIngredientGroup={editModeIngredientGroup}
          deleteIngredient={deleteIngredient}
          ingredCategoryData={ingredCategoryData}
        selected={selectedIngredientGroupId === ingredCategoryData.groupId}
        />)
      }

    </div>
  )
}
