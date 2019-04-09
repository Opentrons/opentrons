// @flow
import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import styles from './styles.css'
type Props = {
  message: ?string,
}
type State = { dismissed: boolean }

const TITLE = 'Error updating pipette settings'
export default class ConfigBanner extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { dismissed: false }
  }

  render() {
    const { message } = this.props
    const isVisible = message && !this.state.dismissed
    if (!isVisible) return null

    return (
      <AlertItem
        type="warning"
        onCloseClick={() => this.setState({ dismissed: true })}
        title={TITLE}
      >
        <p className={styles.config_submit_error}>
          Some of the pipette config settings submitted were not valid.
        </p>
        <p className={styles.config_submit_error}>
          <strong>ERROR: {message}</strong>
        </p>
        <p className={styles.config_submit_error}>Please contact support.</p>
      </AlertItem>
    )
  }
}
