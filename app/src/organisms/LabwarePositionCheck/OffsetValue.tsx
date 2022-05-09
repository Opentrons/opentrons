import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, Flex } from '@opentrons/components'
import { LabwareOffset } from '@opentrons/api-client'
import { OffsetVector } from '../../molecules/OffsetVector'
import { StyledText } from '../../atoms/text'

interface OffsetValueProps {
  initialOffset: LabwareOffset
}
export function OffsetValue(props: OffsetValueProps): JSX.Element {
  const { initialOffset } = props
  const {t} = useTranslation('labware_position_check')
  const currentVector = initialOffset.vector
  return (
    <Flex backgroundColor={COLORS.background}>
      <StyledText as="h6">{t('labware_offset')}</StyledText>
      <OffsetVector {...currentVector}/>
    </Flex>
  )
}
