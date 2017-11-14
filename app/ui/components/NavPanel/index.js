// side nav panel container
import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {
  actions as interfaceActions,
  selectors as interfaceSelectors
} from '../../interface'

import SidePanel from './SidePanel'
import ConnectPanel from './ConnectPanel'

export default connect(mapStateToProps, mapDispatchToProps)(NavPanel)

// TODO(mc, 2017-11-09): move to central location (interface/index.js?)
const PANELS = [
  {name: 'upload', title: 'Upload File'},
  {name: 'setup', title: 'Prep for Run'},
  {name: 'connect', title: 'Connect to a Robot'}
]

const PANELS_BY_NAME = {
  connect: ConnectPanel
  // upload: UploadPanel,
  // setup: ConnectedSetupPanel
}

NavPanel.propTypes = {
  panel: PropTypes.oneOf(['upload', 'connect', 'setup']).isRequired,
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired
}

function NavPanel (props) {
  const {panel, isOpen, close} = props
  const PanelContents = PANELS_BY_NAME[panel]
  const panelProps = PANELS.find((p) => p.name === panel) || {}

  return (
    <SidePanel isOpen={isOpen} close={close} title={panelProps.title}>
      <PanelContents />
    </SidePanel>
  )
}

function mapStateToProps (state) {
  return {
    isOpen: interfaceSelectors.getIsPanelOpen(state),
    panel: interfaceSelectors.getCurrentPanel(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    close: () => dispatch(interfaceActions.closePanel())
  }
}
