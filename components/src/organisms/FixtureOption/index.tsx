import { TertiaryButton } from '../../atoms/buttons'
import { ListItem } from '../../atoms/ListItem/index'
import { StyledText } from '../../atoms/StyledText'
import { Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { MouseEventHandler, ReactNode } from 'react'

interface FixtureOptionProps {
  onClickHandler: MouseEventHandler
  secondaryOnClickHandler?: MouseEventHandler
  optionName: string
  secondaryButtonText?: string
  buttonText: string
}
export function FixtureOption(props: FixtureOptionProps): ReactNode {
  const {
    onClickHandler,
    optionName,
    buttonText,
    secondaryOnClickHandler,
    secondaryButtonText,
  } = props
  return (
    <ListItem
      type="default"
      padding={`${SPACING.spacing16} ${SPACING.spacing12}`}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <StyledText
        desktopStyle="bodyDefaultSemiBold"
        oddStyle="bodyTextSemiBold"
      >
        {optionName}
      </StyledText>
      <Flex gridGap={SPACING.spacing4} justifyContent={JUSTIFY_FLEX_END}>
        {secondaryOnClickHandler !== null &&
        secondaryButtonText !== undefined ? (
          <TertiaryButton
            buttonType="secondary"
            onClick={secondaryOnClickHandler}
            data-testid={optionName}
          >
            {secondaryButtonText}
          </TertiaryButton>
        ) : null}
        <TertiaryButton
          buttonType="primary"
          onClick={onClickHandler}
          data-testid={optionName}
        >
          {buttonText}
        </TertiaryButton>
      </Flex>
    </ListItem>
  )
}
