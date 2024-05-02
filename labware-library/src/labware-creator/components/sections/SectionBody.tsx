import * as React from 'react'
import styles from './SectionBody.module.css'

interface Props {
  children: React.ReactNode
  headingClassName?: string
  label: string
  id?: string
}

export const SectionBody = (props: Props): JSX.Element => (
  <div className={styles.section_wrapper} id={props.id}>
    <h2 className={props.headingClassName || styles.section_header}>
      {props.label}
    </h2>
    {props.children}
  </div>
)
