import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StatusLabel } from '../../atoms/StatusLabel'
import {
  Flex,
  TYPOGRAPHY,
  FONT_WEIGHT_REGULAR,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  WRAP,
  Box,
} from '@opentrons/components'
import { THERMOCYCLER_MODULE_V2 } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'

import type { ThermocyclerData } from '../../redux/modules/api-types'
import type { ThermocyclerModuleModel } from '@opentrons/shared-data'

interface ThermocyclerModuleProps {
  moduleModel: ThermocyclerModuleModel
  data: ThermocyclerData
}

export const ThermocyclerModuleData = (
  props: ThermocyclerModuleProps
): JSX.Element | null => {
  const { moduleModel, data } = props
  const { t } = useTranslation('device_details')

  const getStatusLabelProps = (
    status: string | null
  ): { backgroundColor: string; iconColor: string; textColor: string } => {
    const StatusLabelProps = {
      backgroundColor: COLORS.medGreyEnabled,
      iconColor: COLORS.darkGreyEnabled,
      textColor: COLORS.bluePressed,
      pulse: false,
    }

    switch (status) {
      case 'closed':
      case 'idle': {
        StatusLabelProps.backgroundColor = COLORS.medGreyEnabled
        StatusLabelProps.iconColor = COLORS.darkGreyEnabled
        StatusLabelProps.textColor = COLORS.darkBlackEnabled
        break
      }
      case 'open':
      case 'holding at target': {
        StatusLabelProps.backgroundColor = COLORS.medBlue
        StatusLabelProps.iconColor = COLORS.blueEnabled
        break
      }
      case 'cooling':
      case 'heating': {
        StatusLabelProps.backgroundColor = COLORS.medBlue
        StatusLabelProps.pulse = true
        break
      }
      case 'error': {
        StatusLabelProps.backgroundColor = COLORS.warningBackgroundLight
        StatusLabelProps.iconColor = COLORS.warningEnabled
        StatusLabelProps.textColor = COLORS.warningText
      }
    }
    return StatusLabelProps
  }

  return (
    <Flex flexWrap={WRAP} gridGap={`${SPACING.spacing1} ${SPACING.spacing6}`}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid="thermocycler_module_data_lid"
        gridColumn="1/4"
      >
        <StyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginTop={SPACING.spacing3}
          marginBottom={
            moduleModel === THERMOCYCLER_MODULE_V2 ? '0rem' : SPACING.spacing2
          }
        >
          {t('tc_lid')}
        </StyledText>
        {moduleModel === THERMOCYCLER_MODULE_V2 ? (
          //  TODO(jr, 9/22/22): when the module endpoint includes lid temperature status, add the status label
          // <Flex flexDirection={DIRECTION_ROW}>
          <Box marginRight={SPACING.spacing2}>
            <StatusLabel
              status={data.lidStatus}
              {...getStatusLabelProps(data.lidStatus)}
            />
          </Box>
        ) : //  <StatusLabel
        //     status={data.lidTemperatureStatus}
        //     {...getStatusLabelProps(data.lidTemperatureStatus)}
        //   />
        // </Flex>
        null}
        <StyledText
          title="lid_target_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginBottom={SPACING.spacing1}
        >
          {t(data.lidTargetTemperature == null ? 'na_temp' : 'target_temp', {
            temp: data.lidTargetTemperature,
          })}
        </StyledText>
        <StyledText title="lid_temp" fontSize={TYPOGRAPHY.fontSizeCaption}>
          {t('current_temp', { temp: data.lidTemperature })}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid="thermocycler_module_data_block"
        gridColumn="5/8"
      >
        <StyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginTop={SPACING.spacing3}
        >
          {t('tc_block')}
        </StyledText>
        <StatusLabel
          status={data.status}
          {...getStatusLabelProps(data.status)}
        />
        <StyledText
          title="tc_target_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginBottom={SPACING.spacing1}
        >
          {t(data.targetTemperature == null ? 'na_temp' : 'target_temp', {
            temp: data.targetTemperature,
          })}
        </StyledText>
        <StyledText
          title="tc_current_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
        >
          {t('current_temp', { temp: data.currentTemperature })}
        </StyledText>
      </Flex>
    </Flex>
  )
}
