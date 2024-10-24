import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  Link,
  SPACING,
  StyledText,
} from '@opentrons/components'

export function MagnetModuleChangeContent(): JSX.Element {
  const { t } = useTranslation('starting_deck_state')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('gen1_gen2_different_units')}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('convert_gen1_to_gen2')}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('convert_gen2_to_gen1')}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('alter_pause')}
      </StyledText>
      <Flex>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('read_more_gen1_gen2')}{' '}
          <Link
            external
            href="http://support.opentrons.com/en/articles/1820112-magnetic-module"
          >
            {t('here')}
          </Link>
        </StyledText>
      </Flex>
    </Flex>
  )
}
