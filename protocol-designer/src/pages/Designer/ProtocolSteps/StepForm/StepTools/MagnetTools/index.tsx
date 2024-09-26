import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { getMagneticLabwareOptions } from '../../../../../../ui/modules/selectors'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { StepFormProps } from '../../types'

export function MagnetTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getMagneticLabwareOptions)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing16} ${SPACING.spacing12} ${SPACING.spacing16}`}
        gridGap={SPACING.spacing12}
        width="100%"
      >
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('protocol_steps:module')}
        </StyledText>
        <ListItem type="noActive">
          <Flex padding={SPACING.spacing12}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {moduleLabwareOptions[0].name}
            </StyledText>
          </Flex>
        </ListItem>
      </Flex>
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
    </Flex>
  )
}
