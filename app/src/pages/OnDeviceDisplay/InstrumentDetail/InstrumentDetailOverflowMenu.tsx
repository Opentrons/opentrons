import * as React from 'react'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'
import {
  SINGLE_MOUNT_PIPETTES,
  NINETY_SIX_CHANNEL,
  FLEX_ROBOT_TYPE,
  getPipetteModelSpecs,
} from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { PipetteWizardFlows } from '../../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../../organisms/GripperWizardFlows'
import { DropTipWizard } from '../../../organisms/DropTipWizard'
import { FLOWS } from '../../../organisms/PipetteWizardFlows/constants'
import { GRIPPER_FLOW_TYPES } from '../../../organisms/GripperWizardFlows/constants'

import type { PipetteData, GripperData } from '@opentrons/api-client'
import type { PipetteMount } from '@opentrons/shared-data'

interface InstrumentDetailsOverflowMenuProps {
  instrument: PipetteData | GripperData
}

export const handleInstrumentDetailOverflowMenu = (
  instrument: InstrumentDetailsOverflowMenuProps['instrument']
): void => {
  NiceModal.show(InstrumentDetailsOverflowMenu, { instrument })
}

const InstrumentDetailsOverflowMenu = NiceModal.create(
  (props: InstrumentDetailsOverflowMenuProps): JSX.Element => {
    const { instrument } = props
    const { t } = useTranslation('robot_controls')
    const modal = useModal()
    const [showDropTipWizard, setShowDropTipWizard] = React.useState(false)
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
    const pipetteModelSpecs =
      getPipetteModelSpecs((instrument as PipetteData).instrumentModel) ?? null
    const isPipette = instrument.mount !== 'extension'

    const is96Channel =
      instrument != null &&
      instrument.ok &&
      isPipette &&
      instrument.data?.channels === 96

    const handleRecalibrate: React.MouseEventHandler = () => {
      if (instrument != null && instrument.ok) {
        setWizardProps(
          !isPipette
            ? {
                ...sharedGripperWizardProps,
                flowType: GRIPPER_FLOW_TYPES.RECALIBRATE,
              }
            : {
                closeFlow: () => {
                  modal.remove()
                },
                mount: instrument.mount as PipetteMount,
                selectedPipette: is96Channel
                  ? NINETY_SIX_CHANNEL
                  : SINGLE_MOUNT_PIPETTES,
                flowType: FLOWS.CALIBRATE,
              }
        )
      }
    }

    return (
      <>
        <MenuList onClick={modal.remove} isOnDevice={true}>
          <MenuItem key="recalibrate" onClick={handleRecalibrate}>
            <Flex alignItems={ALIGN_CENTER}>
              <Icon
                name="restart"
                size="2.5rem"
                color={COLORS.black}
                aria-label="restart_icon"
              />
              <StyledText
                as="h4"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                marginLeft={SPACING.spacing12}
              >
                {t('recalibrate')}
              </StyledText>
            </Flex>
          </MenuItem>
          {isPipette ? (
            <MenuItem
              key="drop-tips"
              onClick={() => setShowDropTipWizard(true)}
            >
              <Flex alignItems={ALIGN_CENTER}>
                <Icon
                  name="reset-position"
                  aria-label="reset-position_icon"
                  size="2.5rem"
                />
                <StyledText
                  as="h4"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  marginLeft={SPACING.spacing12}
                >
                  {t('drop_tips')}
                </StyledText>
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
        {showDropTipWizard && isPipette && pipetteModelSpecs != null ? (
          <DropTipWizard
            robotType={FLEX_ROBOT_TYPE}
            mount={instrument.mount}
            instrumentModelSpecs={pipetteModelSpecs}
            closeFlow={modal.remove}
          />
        ) : null}
      </>
    )
  }
)
