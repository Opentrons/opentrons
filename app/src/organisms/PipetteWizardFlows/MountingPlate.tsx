import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LEFT } from '@opentrons/shared-data'
import { LEGACY_COLORS, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { getPipetteAnimations96 } from './utils'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
import type { PipetteWizardStepProps } from './types'

export const MountingPlate = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const {
    goBack,
    proceed,
    flowType,
    chainRunCommands,
    errorMessage,
    setShowErrorMessage,
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

  return errorMessage ? (
    <SimpleWizardBody
      iconColor={LEGACY_COLORS.errorEnabled}
      header={t('shared:error_encountered')}
      isSuccess={false}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={t(
        flowType === FLOWS.ATTACH
          ? 'attach_mounting_plate'
          : 'unscrew_and_detach'
      )}
      rightHandBody={getPipetteAnimations96({
        section: SECTIONS.MOUNTING_PLATE,
        flowType: flowType,
      })}
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
      proceed={flowType === FLOWS.DETACH ? proceed : handleAttachMountingPlate}
      back={goBack}
    />
  )
}
