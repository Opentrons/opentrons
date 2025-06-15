import { TertiaryButton } from '../../atoms/buttons'
import { ListItem } from '../../atoms/ListItem/index'
import { StyledText } from '../../atoms/StyledText'
import { ALIGN_CENTER, JUSTIFY_SPACE_BETWEEN } from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { MouseEventHandler } from 'react'

interface FixtureOptionProps {
  onClickHandler: MouseEventHandler
  optionName: string
  buttonText: string
  isOnDevice: boolean
}
export function FixtureOption(props: FixtureOptionProps): JSX.Element {
  const { onClickHandler, optionName, buttonText } = props
  return (
    <ListItem
      type="default"
      padding={SPACING.spacing16 + ' ' + SPACING.spacing24}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <StyledText desktopStyle="bodyDefaultSemiBold">{optionName}</StyledText>
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
