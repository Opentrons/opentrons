// @flow
// nav button container
import { NavButton as GenericNavButton } from '@opentrons/components'
import * as React from 'react'
import type { ContextRouter } from 'react-router-dom'
import { withRouter } from 'react-router-dom'

import type { NavLocation } from '../../nav/types'
import styles from './styles.css'

export type NavButtonProps = {|
  ...ContextRouter,
  ...NavLocation,
  isBottom: boolean,
|}

export function NavButtonWithoutRouter(props: NavButtonProps): React.Node {
  const {
    path,
    title,
    iconName,
    disabledReason,
    notificationReason,
    isBottom,
  } = props

  // TODO(mc, 2019-11-26): bottom aligned nav button does not work with current
  // tooltip wrapper implementation
  const tooltip =
    !isBottom && (disabledReason || notificationReason) ? (
      <div className={styles.nav_button_tooltip}>
        {disabledReason || notificationReason}
      </div>
    ) : null

  return (
    <GenericNavButton
      iconName={iconName}
      title={title}
      url={path}
      notification={notificationReason != null}
      disabled={disabledReason != null}
      tooltipComponent={tooltip}
      isBottom={isBottom}
    />
  )
}

export const NavButton: React.AbstractComponent<
  $Diff<NavButtonProps, ContextRouter>
> = withRouter(NavButtonWithoutRouter)
