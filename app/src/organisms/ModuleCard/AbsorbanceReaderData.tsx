import { useTranslation } from 'react-i18next'
import { COLORS, StyledText } from '@opentrons/components'

import { StatusLabel } from '/app/atoms/StatusLabel'

import type { AbsorbanceReaderModule } from '/app/redux/modules/types'

interface AbsorbanceReaderProps {
  moduleData: AbsorbanceReaderModule['data']
}

export const AbsorbanceReaderData = (
  props: AbsorbanceReaderProps
): JSX.Element | null => {
  const { moduleData } = props
  const { t, i18n } = useTranslation(['device_details', 'shared'])

  const StatusLabelProps = {
    status: 'Idle',
    backgroundColor: COLORS.grey30,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
    pulse: false,
  }
  switch (moduleData.status) {
    case 'measuring': {
      StatusLabelProps.status = 'Reading'
      StatusLabelProps.backgroundColor = COLORS.blue30
      StatusLabelProps.iconColor = COLORS.blue60
      StatusLabelProps.textColor = COLORS.blue60
      break
    }
    case 'error': {
      StatusLabelProps.status = 'Error'
      StatusLabelProps.backgroundColor = COLORS.yellow30
      StatusLabelProps.iconColor = COLORS.yellow60
      StatusLabelProps.textColor = COLORS.yellow60
      break
    }
  }
  const lidDisplayStatus =
    moduleData.lidStatus === 'on'
      ? i18n.format(t('shared:closed'), 'capitalize')
      : i18n.format(t('shared:open'), 'capitalize')

  return (
    <>
      <StatusLabel {...StatusLabelProps} />
      <StyledText
        desktopStyle="bodyDefaultRegular"
        data-testid="abs_module_data"
      >
        {t('abs_reader_lid_status', {
          status: lidDisplayStatus,
        })}
      </StyledText>
    </>
  )
}
