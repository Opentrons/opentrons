import React, { useState } from 'react'
import { SecondaryButton } from '@opentrons/components'
import { i18n } from '../../localization'
import { FlexProtocolEditorComponent } from './FlexProtocolEditor'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { UpdateConfirmation } from './FlexUpdateConfirmation'

function FlexFormComponent(): JSX.Element {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleCancelClick = (): any => {
    setShowConfirmation(false)
  }

  const handleConfirmClick = (): any => {
    // handle the update action here
    setShowConfirmation(false)
  }

  function protocolCancelClick(): void {
    setShowConfirmation(true)
  }

  return (
    <>
      {Boolean(showConfirmation) && (
        <>
          <UpdateConfirmation
            confirmationTitle={'Cancel Create Protocol?'}
            confirmationMessage={
              'Are you sure you want to cancel creating a protocol? Progress will be lost, You can’t undo this change.'
            }
            cancelButtonName={'Go back'}
            continueButtonName={'Cancel New Protocol'}
            handleCancelClick={handleCancelClick}
            handleConfirmClick={handleConfirmClick}
          />
        </>
      )}
      <div className={styles.flex_header}>
        <div className={styles.flex_title}>
          <StyledText as="h1">{i18n.t('flex.header.title')}</StyledText>
          <SecondaryButton
            className={styles.cancel_button}
            tabIndex={0}
            onClick={() => protocolCancelClick()}
          >
            <StyledText as="h3">
              {i18n.t('flex.header.cancel_button')}
            </StyledText>
          </SecondaryButton>
        </div>
        <StyledText as="h5" className={styles.right_end}>
          {i18n.t('flex.header.required_fields')}
        </StyledText>
        <FlexProtocolEditorComponent />
      </div>
    </>
  )
}

export const CreateFlexFileForm = FlexFormComponent
