import * as React from 'react'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import capitalize from 'lodash/capitalize'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import detachPipette from '../../assets/images/change-pip/single-channel-detach-pipette.png'
import detach96Pipette from '../../assets/images/change-pip/detach-96-pipette.png'
import { CheckPipetteButton } from './CheckPipetteButton'
import type { PipetteWizardStepProps } from './types'

export const DetachPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { isRobotMoving, goBack, proceed, robotName, selectedPipette } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const isSingleMountPipette = selectedPipette === SINGLE_MOUNT_PIPETTES

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={t(
        isSingleMountPipette ? 'loose_detach' : 'unscrew_remove_96_channel'
      )}
      //  TODO(Jr, 11/8/22): replace image with correct one!
      rightHandBody={
        <img
          src={isSingleMountPipette ? detachPipette : detach96Pipette}
          width="100%"
          alt={
            isSingleMountPipette
              ? 'Detach pipette'
              : 'Unscrew 96 channel pipette'
          }
        />
      }
      bodyText={
        isSingleMountPipette ? (
          <StyledText as="p">{t('hold_and_loosen')}</StyledText>
        ) : (
          <Trans
            t={t}
            i18nKey="secure_pipette"
            components={{
              block: <StyledText as="p" marginBottom="1rem" />,
            }}
          />
        )
      }
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          robotName={robotName}
          proceedButtonText={capitalize(t('shared:continue'))}
          proceed={proceed}
        />
      }
    />
  )
}
