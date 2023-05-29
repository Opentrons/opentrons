import React from 'react'
import styles from './FlexComponents.css'
import { StyledText } from './StyledText'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

interface UpdateConfirmationProps {
  confirmationTitle: string
  confirmationMessage: string
  cancelButtonName: string
  continueButtonName: string
  handleCancelClick: any
  handleConfirmClick: any
}

export const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: #fff // ${COLORS.lightGreyHover};
  }
  &:active {
    background: #fef // ${COLORS.lightGreyPressed};
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
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
            paddingX={SPACING.spacing16}
            marginBottom={SPACING.spacing16}
          >
            <StyledText as="h2">{confirmationTitle}</StyledText>
            <Flex alignItems={ALIGN_CENTER}>
              <Btn size="1.5rem" onClick={handleCancelClick} aria-label="exit">
                <Icon name="close" css={CLOSE_ICON_STYLE} />
              </Btn>
            </Flex>
          </Flex>
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
