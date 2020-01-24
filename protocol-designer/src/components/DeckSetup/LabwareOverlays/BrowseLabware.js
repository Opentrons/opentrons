// @flow
import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { Icon } from '@opentrons/components'
import forEach from 'lodash/forEach'
import { i18n } from '../../../localization'
import type { ThunkDispatch } from '../../../types'
import type { LabwareOnDeck } from '../../../step-forms'
import { drillDownOnLabware } from '../../../labware-ingred/actions'
import { MAIN_CONTENT_FORCED_SCROLL_CLASSNAME } from '../../../ui/steps'
import styles from './LabwareOverlays.css'

type OP = {|
  labwareOnDeck: LabwareOnDeck,
|}

type DP = {|
  drillDown: () => mixed,
|}

type Props = {| ...OP, ...DP |}

function BrowseLabwareOverlay(props: Props) {
  if (props.labwareOnDeck.def.parameters.isTiprack) return null
  return (
    <div className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <a className={styles.overlay_button} onClick={props.drillDown}>
        <Icon className={styles.overlay_icon} name="water" />
        {i18n.t('deck.overlay.browse.view_liquids')}
      </a>
    </div>
  )
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  drillDown: () => {
    // scroll to top of all elements with the special class
    forEach(
      global.document.getElementsByClassName(
        MAIN_CONTENT_FORCED_SCROLL_CLASSNAME
      ),
      elem => {
        elem.scrollTop = 0
      }
    )
    dispatch(drillDownOnLabware(ownProps.labwareOnDeck.id))
  },
})

export const BrowseLabware = connect<Props, OP, _, DP, _, _>(
  null,
  mapDispatchToProps
)(BrowseLabwareOverlay)
