import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

interface WellContentsProps {
  wellName: string
  volume: number
}

export function WellContents(props: WellContentsProps): JSX.Element {
  const { wellName, volume } = props
  const { t } = useTranslation('liquids')

  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
      <Flex width="50%">
        <StyledText desktopStyle="bodyDefaultRegular">{wellName}</StyledText>
      </Flex>
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
