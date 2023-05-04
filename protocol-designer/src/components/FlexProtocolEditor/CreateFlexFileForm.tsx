import * as React from 'react'
import { SecondaryButton } from '@opentrons/components'
import { i18n } from '../../localization'
import { FlexProtocolEditorComponent } from './FlexProtocolEditor'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { selectPageForms } from './constant'
import { PageProps } from '../LandingPage'

function FlexFormComponent(props: PageProps): JSX.Element {
  return (
    <div className={styles.flex_header}>
      <div className={styles.flex_title}>
        <StyledText as="h1">{i18n.t('flex.header.title')}</StyledText>
        <SecondaryButton
          className={styles.cancel_button}
          tabIndex={0}
          onClick={() => props.setPageProps(selectPageForms.defaultLandingPage)}
        >
          <StyledText as="h3">{i18n.t('flex.header.cancel_button')}</StyledText>
        </SecondaryButton>
      </div>
      <StyledText as="h5" className={styles.required_fields}>
        {i18n.t('flex.header.required_fields')}
      </StyledText>
      <FlexProtocolEditorComponent />
    </div>
  )
}

export const CreateFlexFileForm = FlexFormComponent
