// @flow
// import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import {modalHOC} from '../components/modals/Modal'
import MoreOptionsModal from '../components/modals/MoreOptionsModal'

function mapStateToProps (state) {
  return {
    formData: {
      'step-name': 'Example name',
      'step-details': 'Details here blah blah...'
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>) {
  return {
    onDelete: e => console.log('TODO: delete step'),
    onCancel: e => console.log('TODO: cancel'),
    onSave: e => console.log('TODO: save'),
    handleChange: (accessor: string) => () => console.log('TODO: handle change for', accessor),

    onClickAway: () => console.log('clicked away') // TODO do an action
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(modalHOC(MoreOptionsModal))
