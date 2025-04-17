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
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'

import type { ThermocyclerData } from '/app/redux/modules/api-types'
import {
  MODULE_INFO_SUB_CONTAINTER_STYLE,
  MODULE_INFO_HEADER_TEXT_STYLE,
  MODULE_INFO_DETAIL_TEXT_STYLE,
} from './constants'

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
    <>
      <Flex
        css={MODULE_INFO_SUB_CONTAINTER_STYLE}
        data-testid="thermocycler_module_data_lid"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('tc_lid')}
        </StyledText>
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
        <Flex css={MODULE_INFO_SUB_CONTAINTER_STYLE}>
          <StyledText
            css={MODULE_INFO_DETAIL_TEXT_STYLE}
            title="lid_target_temp"
          >
            {t(data.lidTargetTemperature == null ? 'na_temp' : 'target_temp', {
              temp: data.lidTargetTemperature,
            })}
          </StyledText>
          <StyledText css={MODULE_INFO_DETAIL_TEXT_STYLE} title="lid_temp">
            {t('current_temp', { temp: data.lidTemperature })}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        css={MODULE_INFO_SUB_CONTAINTER_STYLE}
        data-testid="thermocycler_module_data_block"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('tc_block')}
        </StyledText>
        <StatusLabel
          status={data.status}
          {...getStatusLabelProps(data.status)}
          key="blockStatus"
          id="blockStatus"
        />
        <Flex css={MODULE_INFO_SUB_CONTAINTER_STYLE}>
          <StyledText
            css={MODULE_INFO_DETAIL_TEXT_STYLE}
            title="tc_target_temp"
          >
            {t(data.targetTemperature == null ? 'na_temp' : 'target_temp', {
              temp: data.targetTemperature,
            })}
          </StyledText>
          <StyledText
            css={MODULE_INFO_DETAIL_TEXT_STYLE}
            title="tc_current_temp"
          >
            {t('current_temp', { temp: data.currentTemperature })}
          </StyledText>
        </Flex>
      </Flex>
    </>
  )
}
