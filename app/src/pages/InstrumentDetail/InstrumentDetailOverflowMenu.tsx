import * as React from 'react'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  SINGLE_MOUNT_PIPETTES,
  NINETY_SIX_CHANNEL,
} from '@opentrons/shared-data'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import { FLOWS } from '../../organisms/PipetteWizardFlows/constants'
import { GRIPPER_FLOW_TYPES } from '../../organisms/GripperWizardFlows/constants'

import type {
  PipetteData,
  GripperData,
  HostConfig,
} from '@opentrons/api-client'

interface InstrumentDetailsOverflowMenuProps {
  instrument: PipetteData | GripperData
  host: HostConfig | null
  toggleDTWiz: () => void
}

export const handleInstrumentDetailOverflowMenu = (
  instrument: InstrumentDetailsOverflowMenuProps['instrument'],
  host: InstrumentDetailsOverflowMenuProps['host'],
  toggleDTWiz: () => void
): void => {
  NiceModal.show(InstrumentDetailsOverflowMenu, {
    instrument,
    host,
    toggleDTWiz,
  })
}

const InstrumentDetailsOverflowMenu = NiceModal.create(
  (props: InstrumentDetailsOverflowMenuProps): JSX.Element => {
    const { instrument, host, toggleDTWiz } = props
    const { t } = useTranslation('robot_controls')
    const modal = useModal()
    const [wizardProps, setWizardProps] = React.useState<
      | React.ComponentProps<typeof GripperWizardFlows>
      | React.ComponentProps<typeof PipetteWizardFlows>
      | null
    >(null)
    const sharedGripperWizardProps: Pick<
      React.ComponentProps<typeof GripperWizardFlows>,
      'attachedGripper' | 'closeFlow'
    > = {
      attachedGripper: instrument,
      closeFlow: () => {
        modal.remove()
      },
    }

    const is96Channel =
      instrument?.ok &&
      instrument.mount !== 'extension' &&
      instrument.data?.channels === 96

    const handleRecalibrate: React.MouseEventHandler = () => {
      if (instrument?.ok) {
        setWizardProps(
          instrument.mount === 'extension'
            ? {
                ...sharedGripperWizardProps,
                flowType: GRIPPER_FLOW_TYPES.RECALIBRATE,
              }
            : {
                closeFlow: () => {
                  modal.remove()
                },
                mount: instrument.mount,
                selectedPipette: is96Channel
                  ? NINETY_SIX_CHANNEL
                  : SINGLE_MOUNT_PIPETTES,
                flowType: FLOWS.CALIBRATE,
              }
        )
      }
    }

    const handleDropTip = (): void => {
      toggleDTWiz()
      modal.remove()
    }

    return (
      <ApiHostProvider {...host} hostname={host?.hostname ?? null}>
        <MenuList onClick={modal.remove} isOnDevice={true}>
          {instrument.data.calibratedOffset?.last_modified != null ? (
            <MenuItem key="recalibrate" onClick={handleRecalibrate}>
              <Flex alignItems={ALIGN_CENTER}>
                <Icon
                  name="restart"
                  size="2.5rem"
                  color={COLORS.black90}
                  aria-label="restart_icon"
                />
                <LegacyStyledText
                  as="h4"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  marginLeft={SPACING.spacing12}
                >
                  {t('recalibrate')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
          ) : null}
          {instrument.mount !== 'extension' ? (
            <MenuItem key="drop-tips" onClick={handleDropTip}>
              <Flex alignItems={ALIGN_CENTER}>
                <Icon
                  name="reset-position"
                  aria-label="reset-position_icon"
                  size="2.5rem"
                />
                <LegacyStyledText
                  as="h4"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  marginLeft={SPACING.spacing12}
                >
                  {t('drop_tips')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
          ) : null}
        </MenuList>
        {wizardProps != null && 'mount' in wizardProps ? (
          <PipetteWizardFlows {...wizardProps} />
        ) : null}
        {wizardProps != null && !('mount' in wizardProps) ? (
          <GripperWizardFlows {...wizardProps} />
        ) : null}
      </ApiHostProvider>
    )
  }
)
