// @flow
import * as React from 'react'
import Nav, { Breadcrumbs } from '../../components/Nav'
import styles from './LabwareCreator.css'

type Props = {|
  children: React.Node,
|}

export default function LabwareCreator(props: Props) {
  return (
    <>
      <Nav />
      <Breadcrumbs />
      <div className={styles.page_wrapper}>{props.children}</div>
    </>
  )
}
