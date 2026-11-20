import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'

import type { MouseEventHandler, ReactNode } from 'react'

interface ODDFixtureOptionProps {
  onClickHandler: MouseEventHandler
  secondaryOnClickHandler?: MouseEventHandler
  optionName: string
  secondaryButtonText?: string
  buttonText: string
}
export function ODDFixtureOption(props: ODDFixtureOptionProps): ReactNode {
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
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      backgroundColor={COLORS.grey35}
    >
      <StyledText oddStyle="bodyTextSemiBold">{optionName}</StyledText>
      <Flex gridGap={SPACING.spacing16} justifyContent={JUSTIFY_FLEX_END}>
        {secondaryOnClickHandler != null && secondaryButtonText != null ? (
          <SmallButton
            buttonType="secondary"
            onClick={secondaryOnClickHandler}
            data-testid={optionName}
            buttonText={secondaryButtonText}
            buttonCategory="rounded"
          />
        ) : null}
        <SmallButton
          onClick={onClickHandler}
          data-testid={optionName}
          buttonText={buttonText}
          buttonCategory="rounded"
        />
      </Flex>
    </ListItem>
  )
}
