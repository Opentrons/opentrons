// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'
import i18n from '../../../localization';
import type {StepFieldName} from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'

type Props = {
  name: StepFieldName,
  wellOrder: any, // TODO: type tuple of enum '12r' | 'r21' | 't2b' | 'b2t'
  toggleWellOrderModal: () => mixed
}

class WellOrderInput extends React.Component<Props> {
  handleClick = () => {
    this.props.toggleWellOrderModal()
  }

  render () {
    return (
      <FormGroup
        label={i18n.t('step_edit_form.field.well_order.label')}
        className={styles.well_order_input}
        >
          <div onClick={this.handleClick} className={styles.well_order_icon}>

          </div>
      </FormGroup>
    )
  }
}

export default WellOrderInput
