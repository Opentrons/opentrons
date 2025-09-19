import { useTranslation } from 'react-i18next'

import {
  Banner,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  ParametersTable,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { RunTimeParameter } from '@opentrons/shared-data'

interface ProtocolParametersProps {
  runTimeParameters: RunTimeParameter[]
}

export function ProtocolParameters({
  runTimeParameters,
}: ProtocolParametersProps): JSX.Element {
  const { t } = useTranslation(['protocol_details', 'protocol_setup'])

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
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('listed_values_are_view_only')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('start_setup_customize_values')}
              </StyledText>
            </Flex>
          </Banner>
          <ParametersTable runTimeParameters={runTimeParameters} t={t} />
        </Flex>
      ) : (
        <InfoScreen
          content={t('protocol_setup:no_parameters_specified_in_protocol')}
        />
      )}
    </Flex>
  )
}
