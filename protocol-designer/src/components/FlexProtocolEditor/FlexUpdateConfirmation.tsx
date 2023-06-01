import React from 'react'
import { css } from 'styled-components'
import styles from './FlexComponents.css'
import { StyledText } from './StyledText'
import { Btn, COLORS, Icon } from '@opentrons/components'

interface UpdateConfirmationProps {
  confirmationTitle: string
  confirmationMessage: string
  cancelButtonName: string
  continueButtonName: string
  handleCancelClick: any
  handleConfirmClick: any
}

const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: ${COLORS.lightGreyHover};
  }
  &:active {
    background: ${COLORS.lightGreyPressed};
  }
`

export const UpdateConfirmation = ({
  confirmationTitle,
  confirmationMessage,
  cancelButtonName,
  continueButtonName,
  handleCancelClick,
  handleConfirmClick,
}: UpdateConfirmationProps): any => {
  return (
    <>
      <div className={styles.confirmation_overlay}>
        <div className={styles.confirmation_model}>
          <div className={styles.flex_title}>
            <StyledText as="h2">{confirmationTitle}</StyledText>
            <Btn size="1.5rem" onClick={handleCancelClick}>
              <Icon name="close" css={CLOSE_ICON_STYLE} />
            </Btn>
          </div>
          <div className={styles.line_separator} />
          <StyledText as="h4">{confirmationMessage}</StyledText>
          <br />
          <br />
          <div className={styles.line_separator} />
          <div className={styles.right_end}>
            <button
              className={styles.confirmation_model_cancel_button}
              onClick={handleCancelClick}
            >
              {cancelButtonName}
            </button>
            <button
              className={styles.confirmation_model_proceed_button}
              onClick={handleConfirmClick}
            >
              {continueButtonName}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
