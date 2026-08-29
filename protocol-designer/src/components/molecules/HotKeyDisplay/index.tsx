import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  SPACING,
  Tag,
} from '@opentrons/components'

import { getUserOS } from '/protocol-designer/pages/Designer/ProtocolSteps/Timeline/utils'

import type { ReactNode } from 'react'

interface HotKeyDisplayProps {
  targetWidth: number
}

export function HotKeyDisplay({ targetWidth }: HotKeyDisplayProps): ReactNode {
  const { t } = useTranslation('starting_deck_state')
  const userOs = getUserOS()
  const isMac = userOs === 'Mac OS'
  return (
    <Flex
      position={POSITION_FIXED}
      left={`calc(1.5rem + ${targetWidth}px)`}
      bottom="0.75rem"
      gridGap={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
    >
      <Tag text={t('double_click_to_edit')} type="default" shrinkToContent />
      <Tag
        text={t('shift_click_to_select_range')}
        type="default"
        shrinkToContent
      />
      <Tag
        text={
          isMac
            ? t('command_click_to_multi_select_mac')
            : t('command_click_to_multi_select_windows')
        }
        type="default"
        shrinkToContent
      />
    </Flex>
  )
}
