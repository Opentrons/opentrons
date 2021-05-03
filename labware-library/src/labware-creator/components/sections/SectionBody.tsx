import * as React from 'react'
import styles from '../Section.css'

interface Props {
  children: JSX.Element
  headingClassName?: string
  label: string
}

export const SectionBody = (props: Props): JSX.Element => (
  <div className={styles.section_wrapper}>
    <h2 className={props.headingClassName || styles.section_header}>
      {props.label}
    </h2>
    {props.children}
  </div>
)
