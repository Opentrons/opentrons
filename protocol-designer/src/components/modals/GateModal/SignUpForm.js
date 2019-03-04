// @flow

import * as React from 'react'
import {makeWidget} from '@typeform/embed'
import styles from '../modal.css'

const SIGNUP_TYPEFORM_URL = 'https://opentrons-ux.typeform.com/to/kr4Bdf'

class SignUpForm extends React.Component<{}> {
  embedElement: React.ElementRef<*>

  constructor (props: {}) {
    super(props)
    this.embedElement = React.createRef()
  }

  componentDidMount () {
    makeWidget(
      this.embedElement.current,
      SIGNUP_TYPEFORM_URL,
      {
        hideScrollbars: true,
      }
    )
  }
  render () {
    return (
      <div ref={this.embedElement} className={styles.sign_up_form_wrapper}></div>
    )
  }
}

export default SignUpForm
