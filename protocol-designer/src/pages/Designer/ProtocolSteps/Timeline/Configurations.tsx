import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LiquidButton } from '/protocol-designer/components/molecules'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import { HardwareStep } from './HardwareStep'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

interface ConfigurationsProps {
  sidebarWidth: number
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}

export function Configurations({
  sidebarWidth,
  showLiquidOverflowMenu,
}: ConfigurationsProps): ReactNode {
  const { t } = useTranslation('protocol_steps')
  return (
    <>
      <Flex
        gridGap={SPACING.spacing8}
        padding={SPACING.spacing12}
        flexDirection={DIRECTION_COLUMN}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          className={clsx(
            lineClampStyles.line_clamp,
            lineClampStyles.word_break_all
          )}
          style={{ WebkitLineClamp: 1 }}
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
