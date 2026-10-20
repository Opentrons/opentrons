import { Trans, useTranslation } from 'react-i18next'

import { LegacyStyledText, SPACING } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'

import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
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
      header={t(
        flowType === FLOWS.ATTACH
          ? 'attach_mounting_plate'
          : 'unscrew_and_detach'
      )}
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
              block: (
                <LegacyStyledText
                  css={BODY_STYLE}
                  marginBottom={SPACING.spacing16}
                />
              ),
            }}
          />
        ) : (
          <LegacyStyledText css={BODY_STYLE}>
            {t('detach_mounting_plate_instructions')}
          </LegacyStyledText>
        )
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={flowType === FLOWS.DETACH ? proceed : handleAttachMountingPlate}
      back={goBack}
    />
  )
}
