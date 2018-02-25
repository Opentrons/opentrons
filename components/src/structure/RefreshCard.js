// @flow
// refreshable card component
import * as React from 'react'

import {IconButton} from '../buttons'
import Card from './Card'
import styles from './structure.css'

type Props = React.ElementProps<typeof Card> & {
  /** a change in the watch prop will trigger a refresh */
  watch: string,
  /** refreshing flag */
  refreshing: boolean,
  /** refresh function */
  refresh: () => mixed,
}

/**
 * Card variant for displaying refreshable data. `props.refresh` will be called
 * on mount, on an update with a change in `props.watch`, or if the user clicks
 * the refresh button. Takes all `Card` props as well as the ones listed here.
 */
export default class RefreshCard extends React.Component<Props> {
  render () {
    const {refresh, refreshing, children} = this.props

    return (
      <Card {...this.props}>
        <IconButton
          name={refreshing ? 'spinner' : 'refresh'}
          className={styles.refresh_card_icon}
          spin={refreshing}
          disabled={refreshing}
          onClick={refresh}
        />
        {children}
      </Card>
    )
  }

  componentDidMount () {
    this.props.refresh()
  }

  componentDidUpdate (prevProps: Props) {
    if (prevProps.watch !== this.props.watch) {
      this.props.refresh()
    }
  }
}
