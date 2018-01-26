// @flow
import { connect } from 'react-redux'
import type {Dispatch} from 'redux'

import StepEditForm from '../components/StepEditForm'

function mapStateToProps (state) {
  return {
    formData: {
      'aspirate--labware': 'sourcePlateId',
      'aspirate--wells': 'A1,A2,A3',
      'aspirate--pipette': '300-single',
      'aspirate--pre-wet-tip': false,
      'aspirate--touch-tip': false,
      'aspirate--air-gap--checkbox': true,
      'aspirate--air-gap--volume': '',
      'aspirate--mix--checkbox': false,
      'aspirate--mix--volume': '',
      'aspirate--mix--time': '',
      'aspirate--disposal-vol--checkbox': false,
      'aspirate--disposal-vol--volume': '',
      'aspirate--change-tip': 'always',
      'dispense--labware': 'destPlateId',
      'dispense--wells': 'B2, C3',
      'dispense--volume': '20',
      'dispense--mix--checkbox': false,
      'dispense--mix--volume': '',
      'dispense--mix--times': '',
      'dispense--delay--checkbox': false,
      'dispense--delay-minutes': '',
      'dispense--delay-seconds': '',
      'dispense--blowout--checkbox': false,
      'dispense--blowout--labware': '',
      'dispense--change-tip': 'never'
    },
    stepType: 'transfer',
    pipetteOptions: [
      {name: '10 μL Single', value: '10-single'}, /* TODO: should be 'p10 single'? What 'value'? */
      {name: '300 μL Single', value: '300-single'},
      {name: '10 μL Multi-Channel', value: '10-multi'},
      {name: '300 μL Multi-Channel', value: '300-multi'}
    ],
    labwareOptions: [
      {name: 'Source Plate', value: 'sourcePlateId'}, /* TODO later: dropdown needs to deal with being empty */
      {name: 'Dest Plate', value: 'destPlateId'},
      {name: 'Trough with very long name', value: 'troughId'}
    ]
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>) {
  return {
    onCancel: e => dispatch({type: 'FAKE_CANCEL'}), // TODO
    onSave: e => dispatch({type: 'FAKE_SAVE'}), // TODO
    handleChange: (accessor: string) => (e: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => {
      // TODO Ian 2018-01-26 factor this nasty type handling out
      const dispatchEvent = value => dispatch({type: 'FORM_CHANGE__STEP_EDIT_FORM', payload: {accessor, value}})

      if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
        dispatchEvent(e.target.checked)
      } else if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        dispatchEvent(e.target.value)
      }
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepEditForm)
