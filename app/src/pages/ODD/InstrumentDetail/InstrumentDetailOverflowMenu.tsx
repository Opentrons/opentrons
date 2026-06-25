import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  LegacyStyledText,
  MenuItem,
  MenuList,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { GripperWizardFlows } from '/app/organisms/GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '/app/organisms/GripperWizardFlows/constants'
import { PipetteWizardFlows } from '/app/organisms/PipetteWizardFlows'
import { FLOWS } from '/app/organisms/PipetteWizardFlows/constants'

import type { ComponentProps, MouseEventHandler } from 'react'
import type {
  GripperData,
  HostConfig,
  PipetteData,
} from '@opentrons/api-client'

interface InstrumentDetailsOverflowMenuProps {
  instrument: PipetteData | GripperData
  host: HostConfig | null
  enableDTWiz: () => void
}

export const handleInstrumentDetailOverflowMenu = (
  instrument: InstrumentDetailsOverflowMenuProps['instrument'],
  host: InstrumentDetailsOverflowMenuProps['host'],
  toggleDTWiz: () => void
): void => {
  NiceModal.show(InstrumentDetailsOverflowMenu, {
    instrument,
    host,
    enableDTWiz: toggleDTWiz,
  })
}

const InstrumentDetailsOverflowMenu = NiceModal.create(
  (props: InstrumentDetailsOverflowMenuProps): JSX.Element => {
    const { instrument, host, enableDTWiz } = props
    const { t } = useTranslation('robot_controls')
    const modal = useModal()
    const [wizardProps, setWizardProps] = useState<
      | ComponentProps<typeof GripperWizardFlows>
      | ComponentProps<typeof PipetteWizardFlows>
      | null
    >(null)
    const sharedGripperWizardProps: Pick<
      ComponentProps<typeof GripperWizardFlows>,
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

    const handleRecalibrate: MouseEventHandler = () => {
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
      enableDTWiz()
      modal.remove()
    }

    // TODO(jh 09-24-24): Create an ODD-specific component that wraps MenuList with a portal.
    return (
      <ApiHostProvider robotName={host?.robotName ?? null}>
        {createPortal(
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
                    forwardedAs="h4"
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
                    forwardedAs="h4"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    marginLeft={SPACING.spacing12}
                  >
                    {t('drop_tips')}
                  </LegacyStyledText>
                </Flex>
              </MenuItem>
            ) : null}
          </MenuList>,
          getTopPortalEl()
        )}
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
