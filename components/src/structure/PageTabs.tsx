// page tabs bar

import * as React from 'react'
import classnames from 'classnames'
import { Link } from 'react-router-dom'

import styles from './structure.module.css'

// TODO(bc, 2021-03-29): this component is only used in RA
// reconsider whether it belongs in components library
interface TabProps {
  title: string
  href: string
  isActive: boolean
  isDisabled: boolean
}

export interface PageTabProps {
  pages: TabProps[]
}

export function PageTabs(props: PageTabProps): JSX.Element {
  return (
    <nav className={styles.page_tabs}>
      {props.pages.map(page => (
        <Tab key={page.title} {...page} />
      ))}
    </nav>
  )
}

function Tab(props: TabProps): JSX.Element {
  const { isDisabled } = props
  const tabLinkClass = classnames(styles.tab_link, {
    [styles.active_tab_link]: props.isActive,
  })

  // TODO(mc, 2017-12-14): make a component for proper disabling of links
  const MaybeLink: any = !isDisabled ? Link : 'span'

  return (
    <MaybeLink to={props.href} className={tabLinkClass}>
      <h3 className={styles.tab_title}>{props.title}</h3>
    </MaybeLink>
  )
}
