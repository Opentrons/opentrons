import { useTranslation } from 'react-i18next'

import { Btn, Icon, StyledText } from '@opentrons/components'

import { GREY_BUTTON_STYLE } from '../../atoms'

interface LiquidButtonProps {
  showLiquidOverflowMenu: (liquidOverflowMenu: boolean) => void
}

export function LiquidButton({
  showLiquidOverflowMenu,
}: LiquidButtonProps): JSX.Element {
  const { t } = useTranslation('starting_deck_state')
  return (
    <Btn
      css={GREY_BUTTON_STYLE}
      onClick={() => {
        showLiquidOverflowMenu(true)
      }}
    >
      <Icon size="1rem" name="water-drop" data-testid="water-drop" />
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('liquid')}</StyledText>
    </Btn>
  )
}
