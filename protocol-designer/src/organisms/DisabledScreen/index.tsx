import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  ModalShell,
  OVERFLOW_HIDDEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../components/portals/TopPortal'

export function DisabledScreen(): JSX.Element {
  const { t } = useTranslation('shared')

  return createPortal(
    <ModalShell
      backgroundColor={`${COLORS.black90}${COLORS.opacity40HexCode}`}
      overflow={OVERFLOW_HIDDEN}
      noPadding
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        width="100vw"
        height="100vh"
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        paddingX={SPACING.spacing80}
      >
        <Icon
          name="browser"
          size="2.5rem"
          color={COLORS.white}
          data-testid="browser_icon_in_DisabledScreen"
        />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold" color={COLORS.white}>
            {t('your_screen_is_too_small')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.white}>
            {t('resize_your_browser')}
          </StyledText>
        </Flex>
      </Flex>
    </ModalShell>,
    getTopPortalEl()
  )
}
