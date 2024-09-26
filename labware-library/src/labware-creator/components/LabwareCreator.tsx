import type * as React from 'react'
import { Nav, Breadcrumbs } from '../../components/Nav'
import styles from './LabwareCreator.module.css'

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
