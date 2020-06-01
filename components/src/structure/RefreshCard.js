// @flow
// refreshable card component
// DO NOT USE THIS COMPONENT; prefer useInterval hook
// TODO(mc, 2020-02-19): remove when last usage is removed
// app/src/components/AppSettings/AppInfoCard.js
import * as React from 'react'

import { IconButton } from '../buttons'
import { Card } from './Card'
import styles from './structure.css'

import type { CardProps } from './Card'

export type RefreshCardProps = {|
  ...CardProps,
  /** a change in the watch prop will trigger a refresh */
  watch?: string,
  /** refreshing flag */
  refreshing?: boolean,
  /** refresh function */
  refresh: () => mixed,
|}

/**
 * Card variant for displaying refreshable data. `props.refresh` will be called
 * on mount, on an update with a change in `props.watch`, or if the user clicks
 * the refresh button. Takes all `Card` props as well as the ones listed here.
 *
 * @deprecated Use {@link Card} with {@link useInterval} hook instead
 */
export class RefreshCard extends React.Component<RefreshCardProps> {
  render(): React.Node {
    const { watch, refresh, refreshing, children, ...cardProps } = this.props

    return (
      <Card {...cardProps}>
        {refreshing != null && (
          <IconButton
            name={refreshing ? 'ot-spinner' : 'refresh'}
            className={styles.refresh_card_icon}
            spin={refreshing}
            disabled={refreshing}
            onClick={refresh}
          />
        )}
        {children}
      </Card>
    )
  }

  componentDidMount() {
    this.props.refresh()
  }

  componentDidUpdate(prevProps: RefreshCardProps) {
    if (prevProps.watch !== this.props.watch) {
      this.props.refresh()
    }
  }
}
