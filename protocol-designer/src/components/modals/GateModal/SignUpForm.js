// @flow

import * as React from 'react'
import { makeWidget } from '@typeform/embed'
import { isProduction } from '../../../networking/opentronsWebApi'
import styles from '../modal.css'

// TODO: BC: 2019-03-05 this should be an env var fallback to staging after the initial prod deploy

const STAGING_TYPEFORM_URL = 'https://opentrons-ux.typeform.com/to/Td95E9'
const PROD_TYPEFORM_URL = 'https://opentrons-ux.typeform.com/to/kr4Bdf'
const SIGNUP_TYPEFORM_URL = isProduction
  ? PROD_TYPEFORM_URL
  : STAGING_TYPEFORM_URL

export class SignUpForm extends React.Component<{}> {
  embedElement: React.ElementRef<*>

  constructor(props: {}) {
    super(props)
    this.embedElement = React.createRef()
  }

  componentDidMount() {
    makeWidget(this.embedElement.current, SIGNUP_TYPEFORM_URL, {
      hideScrollbars: true,
    })
  }
  render(): React.Node {
    return (
      <div ref={this.embedElement} className={styles.sign_up_form_wrapper} />
    )
  }
}
