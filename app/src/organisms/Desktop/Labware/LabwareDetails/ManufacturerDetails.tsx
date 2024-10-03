import { useTranslation } from 'react-i18next'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import type { LabwareBrand } from '@opentrons/shared-data'

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
    <Box backgroundColor={COLORS.grey20} padding={SPACING.spacing16}>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText as="h6">{t('manufacturer')}</LegacyStyledText>
          <LegacyStyledText as="p">{manufacturerValue}</LegacyStyledText>
          {links != null &&
            links.length > 0 &&
            links.map((href, index) => (
              <LegacyStyledText as="p" key={index}>
                <Link href={href} external>
                  website <Icon height="10px" name="open-in-new" />
                </Link>
              </LegacyStyledText>
            ))}
        </Flex>
        {brandId != null && brandId.length > 0 && (
          <Flex flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText as="h6">
              {t('manufacturer_number')}
            </LegacyStyledText>
            <LegacyStyledText as="p">{brandId.join(', ')}</LegacyStyledText>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
