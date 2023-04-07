import * as React from 'react'
import { i18n } from '../localization'
import styles from './FlexComponents.css'

function FlexFormComponent(): JSX.Element {
  return (
      <h1>{i18n.t('flex.header.title')}</h1>
  )
}

export const FlexForm = FlexFormComponent
