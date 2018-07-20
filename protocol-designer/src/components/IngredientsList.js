// @flow
// TODO: Ian 2018-06-07 break out these components into their own files (make IngredientsList a directory)
import React from 'react'

import {IconButton, SidePanel, TitledList, swatchColors} from '@opentrons/components'
import stepItemStyles from './steplist/StepItem.css'
import StepDescription from './StepDescription'
import styles from './IngredientsList.css'
import type {IngredientGroups, IngredientInstance} from '../labware-ingred/types'
import type {SingleLabwareLiquidState} from '../step-generation'

type DeleteIngredient = (args: {|groupId: string, wellName?: string|}) => mixed
type EditModeIngredientGroup = (args: {|groupId: string, wellName: ?string|}) => mixed

// Props used by both IngredientsList and IngredGroupCard
type CommonProps = {|
  editModeIngredientGroup: EditModeIngredientGroup,
  deleteIngredient: DeleteIngredient,
  selected?: boolean
|}

type CardProps = {|
  groupId: string,
  ingredGroup: IngredientInstance,
  labwareWellContents: SingleLabwareLiquidState,
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
    const {
      ingredGroup,
      editModeIngredientGroup,
      deleteIngredient,
      selected,
      groupId,
      labwareWellContents
    } = this.props
    const {serializeName, individualize, description, name} = ingredGroup
    const {isExpanded} = this.state

    const wellsWithIngred = Object.keys(labwareWellContents).filter(well =>
      labwareWellContents[well][groupId])

    if (wellsWithIngred.length < 1) {
      // do not show ingred card if it has no instances for this labware
      return null
    }

    return (
      <TitledList
        title={name || 'Unnamed Ingredient'}
        className={styles.ingredient_titled_list}
        iconProps={{style: {fill: swatchColors(Number(groupId))}}}
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
        {wellsWithIngred.map((well, i) => {
          const wellIngredForCard = labwareWellContents[well][groupId]
          const volume = wellIngredForCard && wellIngredForCard.volume

          if (volume == null) {
            // TODO: Ian 2018-06-07 use assert
            console.warn(`Got null-ish volume for well: ${well}, ingred: ${groupId}`)
            return null
          }

          return <IngredIndividual key={well}
            name={individualize
              ? `${serializeName || 'Sample'} ${i + 1}` // TODO IMMED SORT AND NUMBER
              : ''
            }
            wellName={well}
            canDelete
            volume={volume}
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
  ingredientGroups: IngredientGroups,
  labwareWellContents: SingleLabwareLiquidState,
  selectedIngredientGroupId: ?string,
  renameLabwareFormMode: boolean,
  openRenameLabwareForm: () => mixed
}

export default function IngredientsList (props: Props) {
  const {
    labwareWellContents,
    ingredientGroups,
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
          iconName='pen'
          selected={renameLabwareFormMode}
          onClick={openRenameLabwareForm}
        />

        {Object.keys(ingredientGroups).map((groupIdForCard) =>
          <IngredGroupCard key={groupIdForCard}
            editModeIngredientGroup={editModeIngredientGroup}
            deleteIngredient={deleteIngredient}
            labwareWellContents={labwareWellContents}
            ingredGroup={ingredientGroups[groupIdForCard]}
            groupId={groupIdForCard}
            selected={selectedIngredientGroupId === groupIdForCard}
          />)
        }
    </SidePanel>
  )
}
