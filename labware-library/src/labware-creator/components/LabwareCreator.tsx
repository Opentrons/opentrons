import { Breadcrumbs, Nav } from '../../components/Nav'
import styles from './LabwareCreator.module.css'

import type * as React from 'react'

interface Props {
  children: React.ReactNode
}

export function LabwareCreator(props: Props): JSX.Element {
  return (
    <>
      <Nav />
      <Breadcrumbs />
      <div className={styles.page_wrapper}>{props.children}</div>
    </>
  )
}
