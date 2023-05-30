import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { RIGHT } from '@opentrons/shared-data'
import { SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import attachMountingPlate from '../../assets/images/change-pip/attach-mounting-plate.png'
import { BODY_STYLE, FLOWS } from './constants'
import type { PipetteWizardStepProps } from './types'

export const MountingPlate = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const {
    goBack,
    proceed,
    flowType,
    chainRunCommands,
    setShowErrorMessage,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleDetachMountingPlate = (): void => {
    chainRunCommands(
      [
        {
          // @ts-expect-error calibration type not yet supported
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: RIGHT,
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }

  return (
    <GenericWizardTile
      header={t(
        flowType === FLOWS.ATTACH
          ? 'attach_mounting_plate'
          : 'unscrew_and_detach'
      )}
      rightHandBody={
        <img
          //  TODO(jr 12/2/22): update image
          src={
            flowType === FLOWS.ATTACH
              ? attachMountingPlate
              : attachMountingPlate
          }
          style={{ marginTop: '-3rem' }}
          alt={
            flowType === FLOWS.ATTACH
              ? 'Attach mounting plate'
              : 'Detach mounting plate'
          }
        />
      }
      bodyText={
        flowType === FLOWS.ATTACH ? (
          <Trans
            t={t}
            i18nKey="attach_mounting_plate_instructions"
            components={{
              block: (
                <StyledText css={BODY_STYLE} marginBottom={SPACING.spacing16} />
              ),
            }}
          />
        ) : (
          <StyledText css={BODY_STYLE}>
            {t('detach_mounting_plate_instructions')}
          </StyledText>
        )
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={flowType === FLOWS.ATTACH ? proceed : handleDetachMountingPlate}
      back={goBack}
    />
  )
}
