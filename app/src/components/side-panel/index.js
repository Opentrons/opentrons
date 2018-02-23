// side nav panel container
import React from 'react'
import {withRouter} from 'react-router'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {
  PANEL_NAMES,
  PANEL_PROPS_BY_NAME,
  actions as interfaceActions,
  selectors as interfaceSelectors
} from '../../interface'

import {SidePanel} from '@opentrons/components'
import ConnectPanel from '../connect-panel'
import UploadPanel from '../upload-panel'
import SetupPanel from '../setup-panel'
import MenuPanel from '../menu-panel'

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(NavPanel)
)

const PANELS_BY_NAME = {
  connect: ConnectPanel,
  upload: UploadPanel,
  setup: SetupPanel,
  more: MenuPanel
}

NavPanel.propTypes = {
  panel: PropTypes.oneOf(PANEL_NAMES).isRequired,
  isClosed: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired
}

function NavPanel (props) {
  const {panel, isClosed} = props
  const PanelContents = PANELS_BY_NAME[panel]
  const panelProps = PANEL_PROPS_BY_NAME[panel]
  // TODO (ka 2018-2-6): revisit removal of closed panel state,
  // hiding for now, by removing onCloseClick prop
  return (
    <SidePanel isClosed={isClosed} title={panelProps.title}>
      <PanelContents />
    </SidePanel>
  )
}

function mapStateToProps (state) {
  return {
    isClosed: interfaceSelectors.getIsPanelClosed(state),
    panel: interfaceSelectors.getCurrentPanel(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    close: () => dispatch(interfaceActions.closePanel())
  }
}
