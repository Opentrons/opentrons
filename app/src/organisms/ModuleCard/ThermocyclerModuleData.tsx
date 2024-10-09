import { useTranslation } from 'react-i18next'
import { StatusLabel } from '/app/atoms/StatusLabel'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_WEIGHT_REGULAR,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'

import type { ThermocyclerData } from '/app/redux/modules/api-types'

interface ThermocyclerModuleProps {
  data: ThermocyclerData
}

export const ThermocyclerModuleData = (
  props: ThermocyclerModuleProps
): JSX.Element | null => {
  const { data } = props
  const { t } = useTranslation('device_details')

  const getStatusLabelProps = (
    status: string | null
  ): {
    backgroundColor: string
    iconColor: string
    textColor: string
  } => {
    const StatusLabelProps = {
      backgroundColor: COLORS.grey30,
      iconColor: COLORS.grey60,
      textColor: COLORS.blue60,
      pulse: false,
    }

    switch (status) {
      case 'idle': {
        StatusLabelProps.backgroundColor = COLORS.grey30
        StatusLabelProps.iconColor = COLORS.grey60
        StatusLabelProps.textColor = COLORS.grey60
        break
      }
      case 'holding at target': {
        StatusLabelProps.backgroundColor = COLORS.blue30
        StatusLabelProps.iconColor = COLORS.blue60
        break
      }
      case 'cooling':
      case 'heating': {
        StatusLabelProps.backgroundColor = COLORS.blue30
        StatusLabelProps.iconColor = COLORS.blue60
        StatusLabelProps.pulse = true
        break
      }
      case 'error': {
        StatusLabelProps.backgroundColor = COLORS.yellow30
        StatusLabelProps.iconColor = COLORS.yellow60
        StatusLabelProps.textColor = COLORS.yellow60
      }
    }
    return StatusLabelProps
  }

  return (
    <Flex flexWrap={WRAP} gridGap={`${SPACING.spacing2} ${SPACING.spacing32}`}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid="thermocycler_module_data_lid"
        gridColumn="1/4"
      >
        <LegacyStyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey60}
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginTop={SPACING.spacing8}
        >
          {t('tc_lid')}
        </LegacyStyledText>

        <Flex flexDirection={DIRECTION_ROW}>
          <Box marginRight={SPACING.spacing4}>
            <StatusLabel
              status={data.lidStatus === 'in_between' ? 'open' : data.lidStatus}
              backgroundColor={COLORS.grey30}
              textColor={COLORS.grey60}
              showIcon={false}
              key="lidStatus"
              id="lidStatus"
            />
          </Box>
          <StatusLabel
            status={data.lidTemperatureStatus}
            {...getStatusLabelProps(data.lidTemperatureStatus)}
            key="lidTempStatus"
            id="lidTempStatus"
          />
        </Flex>
        <LegacyStyledText
          title="lid_target_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginBottom={SPACING.spacing2}
        >
          {t(data.lidTargetTemperature == null ? 'na_temp' : 'target_temp', {
            temp: data.lidTargetTemperature,
          })}
        </LegacyStyledText>
        <LegacyStyledText
          title="lid_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
        >
          {t('current_temp', { temp: data.lidTemperature })}
        </LegacyStyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid="thermocycler_module_data_block"
        gridColumn="5/8"
      >
        <LegacyStyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey60}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginTop={SPACING.spacing8}
        >
          {t('tc_block')}
        </LegacyStyledText>
        <StatusLabel
          status={data.status}
          {...getStatusLabelProps(data.status)}
          key="blockStatus"
          id="blockStatus"
        />
        <LegacyStyledText
          title="tc_target_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginBottom={SPACING.spacing2}
        >
          {t(data.targetTemperature == null ? 'na_temp' : 'target_temp', {
            temp: data.targetTemperature,
          })}
        </LegacyStyledText>
        <LegacyStyledText
          title="tc_current_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
        >
          {t('current_temp', { temp: data.currentTemperature })}
        </LegacyStyledText>
      </Flex>
    </Flex>
  )
}
