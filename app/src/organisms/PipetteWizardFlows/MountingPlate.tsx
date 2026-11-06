import { Trans, useTranslation } from 'react-i18next'

import { SPACING, StyledText } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'

import { GenericWizardTile } from '/app/components/adhoc/shared/wizards/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/components/adhoc/shared/wizards/SimpleWizardBody'
import { WizardBodyText } from '/app/components/adhoc/shared/wizards/WizardBodyText'

import { FLOWS, SECTIONS } from './constants'
import { getPipetteAnimations96 } from './utils'

import type { PipetteWizardStepProps } from './types'

export const MountingPlate = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const {
    isRobotMoving,
    goBack,
    proceed,
    flowType,
    chainRunCommands,
    handleCommandError,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleAttachMountingPlate = (): void => {
    chainRunCommands?.(
      [
        {
          commandType: 'home' as const,
          params: { axes: ['rightZ'] },
        },
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: LEFT,
            motionModifier: 'lowerMountZAxis',
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(handleCommandError)
  }

  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }
  return (
    <GenericWizardTile
      header={
        <StyledText
          desktopStyle="headingSmallBold"
          oddStyle="level4HeaderSemiBold"
        >
          {t(
            flowType === FLOWS.ATTACH
              ? 'attach_mounting_plate'
              : 'unscrew_and_detach'
          )}
        </StyledText>
      }
      rightHandBody={getPipetteAnimations96({
        section: SECTIONS.MOUNTING_PLATE,
        flowType,
      })}
      bodyText={
        flowType === FLOWS.ATTACH ? (
          <Trans
            t={t}
            i18nKey="attach_mounting_plate_instructions"
            components={{
              block: <WizardBodyText marginBottom={SPACING.spacing16} />,
            }}
          />
        ) : (
          <WizardBodyText>
            {t('detach_mounting_plate_instructions')}
          </WizardBodyText>
        )
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={flowType === FLOWS.DETACH ? proceed : handleAttachMountingPlate}
      back={goBack}
    />
  )
}
