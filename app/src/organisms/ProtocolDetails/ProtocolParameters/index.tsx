import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  ParametersTable,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Banner } from '../../../atoms/Banner'

import type { RunTimeParameter } from '@opentrons/shared-data'

interface ProtocolParametersProps {
  runTimeParameters: RunTimeParameter[]
}

export function ProtocolParameters({
  runTimeParameters,
}: ProtocolParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_details')

  return (
    <Flex>
      {runTimeParameters.length > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="100%"
        >
          <Banner
            type="informing"
            width="100%"
            iconMarginLeft={SPACING.spacing4}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t('listed_values_are_view_only')}
              </StyledText>
              <StyledText as="p">
                {t('start_setup_customize_values')}
              </StyledText>
            </Flex>
          </Banner>
          <ParametersTable runTimeParameters={runTimeParameters} t={t} />
        </Flex>
      ) : (
        <InfoScreen contentType="parameters" />
      )}
    </Flex>
  )
}
