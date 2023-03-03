import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons/ODD'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import unscrewCarriage from '../../assets/images/change-pip/unscrew-carriage.png'
import { BODY_STYLE, FLOWS } from './constants'

import type { MotorAxis } from '@opentrons/shared-data'
import type { PipetteWizardStepProps } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const {
    goBack,
    proceed,
    flowType,
    selectedPipette,
    chainRunCommands,
    isOnDevice,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [errorMessage, setErrorMessage] = React.useState<boolean>(false)
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)
  const handleCheckZAxis = (): void => {
    setNumberOfTryAgains(numberOfTryAgains + 1)
    chainRunCommands(
      [
        {
          commandType: 'home' as const,
          params: { axes: ('rightZ' as unknown) as MotorAxis },
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
  //  this should never happen but to be safe
  if (selectedPipette === SINGLE_MOUNT_PIPETTES || flowType === FLOWS.CALIBRATE)
    return null

  return errorMessage ? (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={t('z_axis_still_attached')}
      subHeader={t(
        numberOfTryAgains > 2
          ? 'something_seems_wrong'
          : 'detach_z_axis_screw_again'
      )}
      isSuccess={false}
    >
      <SecondaryButton onClick={goBack} marginRight={SPACING.spacing2}>
        {t('cancel_attachment')}
      </SecondaryButton>
      <PrimaryButton
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        onClick={handleCheckZAxis}
      >
        {t('shared:try_again')}
      </PrimaryButton>
    </SimpleWizardBody>
  ) : (
    <GenericWizardTile
      header={t(
        flowType === FLOWS.ATTACH ? 'unscrew_carriage' : 'reattach_carriage'
      )}
      rightHandBody={
        <img
          //  TODO(jr 12/2/22): update images
          src={flowType === FLOWS.ATTACH ? unscrewCarriage : unscrewCarriage}
          style={{ marginTop: '-3.5rem' }}
          alt={
            flowType === FLOWS.ATTACH ? 'Unscrew gantry' : 'Reattach carriage'
          }
        />
      }
      bodyText={
        <Trans
          t={t}
          i18nKey={
            flowType === FLOWS.ATTACH ? 'unscrew_at_top' : 'how_to_reattach'
          }
          components={{
            block: (
              <StyledText css={BODY_STYLE} marginBottom={SPACING.spacing4} />
            ),
          }}
        />
      }
      back={goBack}
      proceedButton={
        isOnDevice ? (
          <SmallButton onClick={proceed} aria-label="isOnDevice_button">
            <StyledText
              fontSize="1.375rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              padding={SPACING.spacing4}
            >
              {capitalize(t('shared:continue'))}
            </StyledText>
          </SmallButton>
        ) : (
          <PrimaryButton onClick={handleCheckZAxis}>
            {capitalize(t('shared:continue'))}
          </PrimaryButton>
        )
      }
    />
  )
}
