import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { RIGHT, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import capitalize from 'lodash/capitalize'
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
    selectedPipette,
    chainRunCommands,
    setShowErrorMessage,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  //  this should never happen but to be safe
  if (selectedPipette === SINGLE_MOUNT_PIPETTES || flowType === FLOWS.CALIBRATE)
    return null

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
                <StyledText css={BODY_STYLE} marginBottom={SPACING.spacing4} />
              ),
            }}
          />
        ) : (
          <StyledText css={BODY_STYLE}>
            {t('detach_mounting_plate_instructions')}
          </StyledText>
        )
      }
      proceedButtonText={capitalize(t('shared:continue'))}
      proceed={flowType === FLOWS.ATTACH ? proceed : handleDetachMountingPlate}
      back={goBack}
    />
  )
}
