import * as React from 'react'

import {
  StyledText,
  PrimaryButton,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import SuccessIcon from '../../assets/images/icon_success.png'

import type { DropTipWizardContainerProps } from './types'
import { css } from 'styled-components'

type SuccessProps = DropTipWizardContainerProps & {
  message: string
  proceedText: string
  handleProceed: () => void
}
export const Success = (props: SuccessProps): JSX.Element => {
  const {
    message,
    proceedText,
    handleProceed,
    isOnDevice,
    issuedCommandsType,
  } = props

  return (
    <Flex
      css={WIZARD_CONTAINER_STYLE}
      alignItems={ALIGN_CENTER}
      padding={SPACING.spacing32}
      gridGap={issuedCommandsType === 'fixit' ? SPACING.spacing24 : null}
      height="100%"
      marginBottom={
        issuedCommandsType === 'setup' && isOnDevice ? SPACING.spacing80 : null
      }
      marginTop={
        issuedCommandsType === 'fixit' && isOnDevice ? '3.125rem' : null
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        flex="1"
        height="100%"
        gridGap={SPACING.spacing24}
      >
        <img
          src={SuccessIcon}
          alt="Success Icon"
          width="170px"
          height="141px"
        />
        <StyledText desktopStyle="headingSmallBold" oddStyle="level3HeaderBold">
          {message}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END} width="100%" marginLeft="auto">
        {isOnDevice ? (
          <SmallButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            buttonText={proceedText}
            onClick={handleProceed}
          />
        ) : (
          <PrimaryButton onClick={handleProceed}>{proceedText}</PrimaryButton>
        )}
      </Flex>
    </Flex>
  )
}

const WIZARD_CONTAINER_STYLE = css`
  min-height: 394px;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    height: 472px;
  }
`
