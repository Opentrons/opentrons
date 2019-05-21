// @flow
import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import type { BaseState, ThunkDispatch } from '../../../types'
import {
  openIngredientSelector,
  deleteContainer,
  duplicateLabware,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import i18n from '../../../localization'
import type { LabwareEntity } from '../../../step-forms'
import NameThisLabware from './NameThisLabware'
import styles from './LabwareOverlays.css'

type OP = {|
  labwareEntity: LabwareEntity,
|}
type SP = {|
  isYetUnnamed: boolean,
|}
type DP = {|
  editLiquids: () => mixed,
  duplicateLabware: () => mixed,
  deleteLabware: () => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

const EditLabware = (props: Props) => {
  const {
    labwareEntity,
    isYetUnnamed,
    editLiquids,
    deleteLabware,
    duplicateLabware,
  } = props

  if (labwareEntity.def.parameters.isTiprack) return null

  if (isYetUnnamed) {
    return (
      <NameThisLabware
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
  duplicateLabware: () => dispatch(duplicateLabware(ownProps.labwareEntity.id)),
  deleteLabware: () => {
    window.confirm(
      `Are you sure you want to permanently delete this ${
        ownProps.labwareEntity.def.metadata.displayName
      }?`
    ) && dispatch(deleteContainer({ labwareId: ownProps.labwareEntity.id }))
  },
})

export default connect<Props, OP, SP, DP, BaseState, ThunkDispatch<*>>(
  mapStateToProps,
  mapDispatchToProps
)(EditLabware)
