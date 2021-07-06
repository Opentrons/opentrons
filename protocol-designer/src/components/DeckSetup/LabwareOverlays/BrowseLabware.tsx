import * as React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { Icon } from '@opentrons/components'
import { i18n } from '../../../localization'
import { ThunkDispatch } from '../../../types'
import { LabwareOnDeck } from '../../../step-forms'
import { drillDownOnLabware } from '../../../labware-ingred/actions'
import { resetScrollElements } from '../../../ui/steps/utils'
import styles from './LabwareOverlays.css'

interface OP {
  labwareOnDeck: LabwareOnDeck
}

interface DP {
  drillDown: () => unknown
}

type Props = OP & DP

function BrowseLabwareOverlay(props: Props): JSX.Element | null {
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

const mapDispatchToProps = (
  dispatch: ThunkDispatch<any>,
  ownProps: OP
): DP => ({
  drillDown: () => {
    resetScrollElements()
    dispatch(drillDownOnLabware(ownProps.labwareOnDeck.id))
  },
})

export const BrowseLabware = connect(
  null,
  mapDispatchToProps
)(BrowseLabwareOverlay)
