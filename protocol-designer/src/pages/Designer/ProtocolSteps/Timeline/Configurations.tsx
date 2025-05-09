import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LINE_CLAMP_TEXT_STYLE } from '../../../../components/atoms'
import { HardwareStep } from './HardwareStep'
import { LiquidStep } from './LiquidStep'

interface ConfigurationsProps {
  sidebarWidth: number
}

export function Configurations({
  sidebarWidth,
}: ConfigurationsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  return (
    <>
      <Flex
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing12}
        paddingTop={SPACING.spacing12}
        flexDirection={DIRECTION_COLUMN}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          css={LINE_CLAMP_TEXT_STYLE(1)}
        >
          {t('configurations')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <HardwareStep sidebarWidth={sidebarWidth} />
          <LiquidStep sidebarWidth={sidebarWidth} />
        </Flex>
      </Flex>
      <Divider />
    </>
  )
}
