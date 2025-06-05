import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LINE_CLAMP_TEXT_STYLE } from '../../../../components/atoms'
import { LiquidButton } from '../../../../components/molecules'
import { HardwareStep } from './HardwareStep'

import type { Dispatch, SetStateAction } from 'react'

interface ConfigurationsProps {
  sidebarWidth: number
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}

export function Configurations({
  sidebarWidth,
  showLiquidOverflowMenu,
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
          {t('configuration')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <HardwareStep sidebarWidth={sidebarWidth} />
          <LiquidButton
            showLiquidOverflowMenu={showLiquidOverflowMenu}
            isInToolbox
          />
        </Flex>
      </Flex>
      <Divider />
    </>
  )
}
