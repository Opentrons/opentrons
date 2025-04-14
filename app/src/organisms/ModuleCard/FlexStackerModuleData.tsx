import { useTranslation } from 'react-i18next'
import {
  StyledText,
  COLORS,
  LegacyStyledText,
  TYPOGRAPHY,
  SPACING,
  Flex,
  WRAP,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StatusLabel } from '/app/atoms/StatusLabel'

import type { FlexStackerModule } from '/app/redux/modules/types'

interface FlexStackerModuleProps {
  moduleData: FlexStackerModule['data']
}

export function FlexStackerModuleData(
  props: FlexStackerModuleProps
): JSX.Element | null {
  const { moduleData } = props
  const { t, i18n } = useTranslation(['device_details', 'shared'])

  const shuttleDisplayStatus = i18n.format(
    moduleData.platformState == 'extended'
      ? t('flex_stacker_extended')
      : moduleData.platformState == 'retracted'
      ? t('flex_stacker_retracted')
      : t('shared:unknown'),
    'capitalize'
  )

  const doorDisplayStatus = i18n.format(
    moduleData.hopperDoorState === 'closed'
      ? t('shared:closed')
      : t('shared:open'),
    'capitalize'
  )

  const ShuttleStatusLabelProps = {
    status: shuttleDisplayStatus,
    backgroundColor: COLORS.grey30,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
    pulse: false,
  }

  switch (moduleData.platformState) {
    case 'extended':
    case 'retracted': {
      ShuttleStatusLabelProps.backgroundColor = COLORS.blue30
      ShuttleStatusLabelProps.iconColor = COLORS.blue60
      ShuttleStatusLabelProps.textColor = COLORS.blue60
      break
    }
    case 'missing': {
      ShuttleStatusLabelProps.backgroundColor = COLORS.red30
      ShuttleStatusLabelProps.iconColor = COLORS.red60
      ShuttleStatusLabelProps.textColor = COLORS.red60
      break
    }
  }

  const DoorStatusLabelProps = {
    status: doorDisplayStatus,
    backgroundColor: COLORS.grey30,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
    pulse: false,
  }

  if (moduleData.hopperDoorState === 'opened') {
    DoorStatusLabelProps.backgroundColor = COLORS.blue30
    DoorStatusLabelProps.iconColor = COLORS.blue60
    DoorStatusLabelProps.textColor = COLORS.blue60
  }

  return (
    <Flex flexWrap={WRAP} gridGap={`${SPACING.spacing2} ${SPACING.spacing32}`}>
      <Flex flexDirection={DIRECTION_COLUMN} data-testid="stacker_door_data">
        <LegacyStyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey60}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          fontSize={TYPOGRAPHY.fontSizeH6}
          marginTop={SPACING.spacing8}
        >
          {t('flex_stacker_door_status')}
        </LegacyStyledText>
        <StatusLabel {...DoorStatusLabelProps} />
        <LegacyStyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey60}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          fontSize={TYPOGRAPHY.fontSizeH6}
          marginTop={SPACING.spacing8}
        >
          {t('flex_stacker_shuttle_status')}
        </LegacyStyledText>
        <StatusLabel {...ShuttleStatusLabelProps} />
      </Flex>
    </Flex>
  )
}
