// @flow
import * as React from 'react'
import cx from 'classnames'

import styles from './styles.css'

export type PageProps = {
  sidebarLargeOnly: boolean,
  sidebar: React.Node,
  content: React.Node,
}

export default function Page(props: PageProps) {
  const { sidebarLargeOnly, sidebar, content } = props

  return (
    <div className={styles.page}>
      <div className={styles.content_scroller}>
        <div className={styles.content_width_limiter}>
          <div
            className={cx(styles.sidebar_container, {
              [styles.sidebar_large_only]: sidebarLargeOnly,
            })}
          >
            {sidebar}
          </div>
          <section
            className={cx(styles.content_container, {
              [styles.sidebar_large_only]: sidebarLargeOnly,
            })}
          >
            {content}
          </section>
        </div>
      </div>
    </div>
  )
}
