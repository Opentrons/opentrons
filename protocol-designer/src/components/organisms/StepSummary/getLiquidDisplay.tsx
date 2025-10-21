import {
  ALIGN_CENTER,
  Box,
  Flex,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import type { LiquidEntity } from '@opentrons/step-generation'

export function getLiquidDisplay(
  liquidInfo: LiquidEntity[],
  t: any
): JSX.Element | null {
  const liquidLength = liquidInfo.length

  if (liquidLength === 0) {
    return null
  }

  let liquidDisplay: JSX.Element = <Box />

  if (liquidLength === 1) {
    liquidDisplay = (
      <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">{t('of')}</StyledText>
        <Tag
          type="default"
          text={liquidInfo[0].displayName}
          liquidIcon={{ color: liquidInfo[0].displayColor, size: 'xSmall' }}
        />
      </Flex>
    )
  } else if (liquidLength === 2) {
    liquidDisplay = (
      <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">{t('of')}</StyledText>
        <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
          <Tag
            type="default"
            text={liquidInfo[0].displayName}
            liquidIcon={{
              color: liquidInfo[0].displayColor,
              size: 'xSmall',
            }}
          />
          {t('and')}
          <Tag
            type="default"
            text={liquidInfo[1].displayName}
            liquidIcon={{
              color: liquidInfo[1].displayColor,
              size: 'xSmall',
            }}
          />
        </Flex>
      </Flex>
    )
  } else if (liquidLength > 2) {
    liquidDisplay = (
      <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">{t('of')}</StyledText>
        <Tag type="default" text={t('liquids', { num: liquidLength })} />
      </Flex>
    )
  }
  return liquidDisplay
}
