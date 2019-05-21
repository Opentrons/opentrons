// @flow
import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import type { BaseState, ThunkDispatch } from '../../types'
import { openIngredientSelector } from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
// import { openAddLabwareModal } from '../../labware-ingred/actions'
import i18n from '../../localization'
import styles from './DeckSetup.css'
import NameThisLabwareOverlay from './NameThisLabwareOverlay'

type OP = {|
  labwareEntity: LabwareEntity,
|}
type SP = {|
  isYetUnnamed: boolean,
|}
type DP = {|
  editLiquids: () => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

const EditLabwareOverlay = (props: Props) => {
  const { labwareEntity, isYetUnnamed, editLiquids } = props

  if (labwareEntity.def.parameters.isTiprack) return null

  const duplicateLabware = () => {
    console.log('dup labware')
  }
  const deleteLabware = () => {
    console.log('delete labware')
  }

  if (isYetUnnamed) {
    return (
      <NameThisLabwareOverlay
        labwareEntity={labwareEntity}
        editLiquids={editLiquids}
      />
    )
  } else {
    return (
      <div
        className={cx(styles.slot_overlay, {
          [styles.appear_on_mouseover]: !isYetUnnamed,
        })}
      >
        <a className={styles.overlay_button} onClick={editLiquids}>
          <Icon className={styles.overlay_icon} name="pencil" />
          Name & Liquids
        </a>
        <a className={styles.overlay_button} onClick={duplicateLabware}>
          <Icon className={styles.overlay_icon} name="content-copy" />
          Duplicate
        </a>
        <a className={styles.overlay_button} onClick={deleteLabware}>
          <Icon className={styles.overlay_icon} name="close" />
          Delete
        </a>
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareEntity
  const hasName = labwareIngredSelectors.getSavedLabware(state)[id]
  return {
    isYetUnnamed: !ownProps.labwareEntity.def.parameters.isTiprack && !hasName,
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  editLiquids: () =>
    dispatch(openIngredientSelector(ownProps.labwareEntity.id)),
})

export default connect<Props, OP, SP, DP, BaseState, ThunkDispatch<*>>(
  mapStateToProps,
  mapDispatchToProps
)(EditLabwareOverlay)
