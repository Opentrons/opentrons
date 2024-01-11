import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Box,
  Icon,
  Link,
  LEGACY_COLORS,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import type { LabwareBrand } from '../../pages/Labware/types'

export interface ManufacturerDetailsProps {
  brand: LabwareBrand
}

export function ManufacturerDetails(
  props: ManufacturerDetailsProps
): JSX.Element {
  const { t } = useTranslation('labware_details')
  const { brand } = props
  const { brand: brandName, brandId, links } = brand
  const manufacturerValue =
    brandName === 'all' || brandName === 'generic' ? t(brandName) : brandName

  return (
    <Box
      backgroundColor={LEGACY_COLORS.fundamentalsBackground}
      padding={SPACING.spacing16}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="h6">{t('manufacturer')}</StyledText>
          <StyledText as="p">{manufacturerValue}</StyledText>
          {links != null &&
            links.length > 0 &&
            links.map((href, index) => (
              <StyledText as="p" key={index}>
                <Link href={href} external>
                  website <Icon height="10px" name="open-in-new" />
                </Link>
              </StyledText>
            ))}
        </Flex>
        {brandId != null && brandId.length > 0 && (
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="h6">{t('manufacturer_number')}</StyledText>
            <StyledText as="p">{brandId.join(', ')}</StyledText>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
