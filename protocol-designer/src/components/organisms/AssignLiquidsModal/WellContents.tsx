import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface WellContentsProps {
  wellName: string
  volume: number
}

export function WellContents(props: WellContentsProps): ReactNode {
  const { wellName, volume } = props
  const { t } = useTranslation('liquids')

  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
      <StyledText width="50%" desktopStyle="bodyDefaultRegular">
        {wellName}
      </StyledText>
      <Flex width="50%">
        <Tag
          text={`${volume} ${t('microliters')}`}
          type="default"
          shrinkToContent
        />
      </Flex>
    </Flex>
  )
}
