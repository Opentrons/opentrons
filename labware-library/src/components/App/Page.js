// @flow
import * as React from 'react'
import cx from 'classnames'

import styles from './styles.css'

export type PageProps = {|
  scrollRef: { current: HTMLDivElement | null },
  detailPage: boolean,
  sidebar: React.Node,
  content: React.Node,
|}

export function Page(props: PageProps) {
  const { scrollRef, detailPage, sidebar, content } = props

  return (
    <div className={styles.page}>
      <div className={styles.content_scroller} ref={scrollRef}>
        <div className={styles.content_width_limiter}>
          <div
            className={cx(styles.sidebar_container, {
              [styles.is_detail_page]: detailPage,
            })}
          >
            {sidebar}
          </div>
          <section
            className={cx(styles.content_container, {
              [styles.is_detail_page]: detailPage,
            })}
          >
            {content}
          </section>
        </div>
      </div>
    </div>
  )
}
