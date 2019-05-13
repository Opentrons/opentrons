// @flow
import React from 'react'
import type { DeckSlot } from '@opentrons/shared-data'
import { RobotCoordsForeignDiv, Icon } from '@opentrons/components'
import cx from 'classnames'
// import { connect } from 'react-redux'
// import { openAddLabwareModal } from '../../labware-ingred/actions'
import i18n from '../../localization'
import styles from './DeckSetup.css'

type OP = {| slot: DeckSlot |}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
|}
type Props = {| ...OP, ...DP |}

const EditLabwareOverlay = ({ slot, labwareEntity, addLabware }: Props) => {
  if (labwareEntity.def.parameters.isTiprack) return null

  const addLiquids = () => {
    console.log('add liquids')
  }
  const leaveEmpty = () => {
    console.log('leave empty')
  }
  const editLiquids = () => {
    console.log('edit liquids')
  }
  const duplicateLabware = () => {
    console.log('dup labware')
  }
  const deleteLabware = () => {
    console.log('delete labware')
  }
  return (
    <RobotCoordsForeignDiv
      x={slot.position[0]}
      y={slot.position[1]}
      width={slot.boundingBox.xDimension}
      height={slot.boundingBox.yDimension}
      innerDivProps={{
        className: cx(styles.slot_overlay, styles.appear_on_mouseover),
      }}
    >
      <input
        className={styles.name_input}
        // onChange={this.handleChange}
        // onKeyUp={this.handleKeyUp}
        placeholder={i18n.t('deck.overlay.name_labware.nickname_placeholder')}
        // value={this.state.inputValue}
      />

      <p onClick={addLiquids}>
        <Icon className={styles.overlay_icon} name="water" />
        {i18n.t('deck.overlay.name_labware.add_liquids')}
      </p>
      <p onClick={leaveEmpty}>
        <Icon className={styles.overlay_icon} name="ot-water-outline" />
        {i18n.t('deck.overlay.name_labware.leave_empty')}
      </p>

      {/*  can add ingreds */}
      {false && (
        <>
          <div onClick={editLiquids}>
            <Icon name="pencil" />
            <p>Name & Liquids</p>
          </div>
          <div onClick={duplicateLabware}>
            <Icon name="content-copy" />
            <p>Duplicate</p>
          </div>
          <div onClick={deleteLabware}>
            <Icon name="close" />
            <p>Delete</p>
          </div>
        </>
      )}
    </RobotCoordsForeignDiv>
  )
}

// const mapDispatchToProps = (dispatch: Dispatch, ownProps: OP): DP => ({
//   addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
// })

export default EditLabwareOverlay
