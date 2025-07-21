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

import type { MouseEventHandler } from 'react'

interface FixtureOptionProps {
  onClickHandler: MouseEventHandler
  secondaryOnClickHandler?: MouseEventHandler
  optionName: string
  secondaryButtonText?: string
  buttonText: string
}
export function FixtureOption(props: FixtureOptionProps): JSX.Element {
  const {
    onClickHandler,
    optionName,
    buttonText,
    secondaryOnClickHandler,
    secondaryButtonText,
  } = props
  if (secondaryOnClickHandler !== null && secondaryButtonText !== undefined) {
    return (
      <ListItem
        type="default"
        padding={SPACING.spacing16 + ' ' + SPACING.spacing24}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          oddStyle="bodyTextSemiBold"
        >
          {optionName}
        </StyledText>
        <Flex
          gridGap={SPACING.spacing4}
          width={'10rem'}
          justifyContent={JUSTIFY_FLEX_END}
        >
          <TertiaryButton
            buttonType="secondary"
            onClick={secondaryOnClickHandler}
            data-testid={optionName}
          >
            {secondaryButtonText}
          </TertiaryButton>
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
  } else {
    return (
      <ListItem
        type="default"
        padding={SPACING.spacing16 + ' ' + SPACING.spacing24}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          oddStyle="bodyTextSemiBold"
        >
          {optionName}
        </StyledText>
        <TertiaryButton
          buttonType="primary"
          onClick={onClickHandler}
          data-testid={optionName}
        >
          {buttonText}
        </TertiaryButton>
      </ListItem>
    )
  }
}
