// top-level container
import {connect} from 'react-redux'

import {
  actions as interfaceActions,
  selectors as interfaceSelectors
} from '../interface'

import {
  actions as robotActions
} from '../robot'

import SideBar from '../components/SideBar'

const mapStateToProps = (state) => ({
  isOpen: interfaceSelectors.getIsPanelOpen(state),
  currentPanel: interfaceSelectors.getCurrentPanel(state)
})

const mapDispatchToProps = (dispatch) => ({
  close: () => dispatch(interfaceActions.closePanel()),

  onUpload: (event) => {
    let files

    if (event.dataTransfer) {
      files = event.dataTransfer.files
    } else {
      files = event.target.files
    }

    dispatch(robotActions.session(files[0]))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(SideBar)
