import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LEFT } from '@opentrons/shared-data'
import {
  COLORS,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { getPipetteAnimations96 } from './utils'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
import type { PipetteWizardStepProps } from './types'

export const MountingPlate = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const { goBack, proceed, flowType, chainRunCommands, isOnDevice } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [errorMessage, setErrorMessage] = React.useState<boolean>(false)
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)

  const handleAttachMountingPlate = (): void => {
    setNumberOfTryAgains(numberOfTryAgains + 1)
    chainRunCommands(
      [
        {
          commandType: 'home' as const,
          params: { axes: ['rightZ'] },
        },
        {
          // @ts-expect-error calibration type not yet supported
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
        console.error(error.message)
        setErrorMessage(true)
      })
  }

  return errorMessage ? (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={i18n.format(t('z_axis_still_attached'), 'capitalize')}
      subHeader={t(
        numberOfTryAgains > 2
          ? 'something_seems_wrong'
          : 'detach_z_axis_screw_again'
      )}
      isSuccess={false}
    >
      {isOnDevice ? (
        <>
          <SmallButton
            buttonType="alert"
            onClick={goBack}
            buttonText={i18n.format(t('cancel_attachment'), 'capitalize')}
          />
          <SmallButton
            buttonType="primary"
            onClick={handleAttachMountingPlate}
            buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
          />
        </>
      ) : (
        <>
          <SecondaryButton
            isDangerous
            onClick={goBack}
            marginRight={SPACING.spacing4}
          >
            {i18n.format(t('cancel_attachment'), 'capitalize')}
          </SecondaryButton>
          <PrimaryButton onClick={handleAttachMountingPlate}>
            {i18n.format(t('shared:try_again'), 'capitalize')}
          </PrimaryButton>
        </>
      )}
    </SimpleWizardBody>
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
