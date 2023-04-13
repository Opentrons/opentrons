import * as React from 'react'
import { SecondaryButton } from '@opentrons/components'
import { Link } from 'react-router-dom'
import { i18n } from '../localization'
import { FlexProtocolEditor } from './FlexProtocolEditor'
import styles from './FlexComponents.css'

function FlexFormComponent(): JSX.Element {
  return (
    <div className={styles.flex_header}>
      <div className={styles.flex_title}>
        <h1>{i18n.t('flex.header.title')}</h1>
        <Link to={'/'}>
          <SecondaryButton tabIndex={0}>
            {i18n.t('flex.header.cancel_button')}
          </SecondaryButton>
        </Link>
      </div>
      <p className={styles.required_fields}>
        {i18n.t('flex.header.required_fields')}
      </p>
      <FlexProtocolEditor />
    </div>
  )
}

export const FlexForm = FlexFormComponent
