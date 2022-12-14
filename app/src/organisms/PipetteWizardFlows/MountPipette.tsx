import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, JUSTIFY_CENTER } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import attach96Pipette from '../../assets/images/change-pip/attach-96-pipette.png'
import { CheckPipetteButton } from './CheckPipetteButton'
import type { PipetteWizardStepProps } from './types'

export const MountPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack, robotName, selectedPipette } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const isSingleMountPipette = selectedPipette === SINGLE_MOUNT_PIPETTES

  return (
    <GenericWizardTile
      header={t(
        isSingleMountPipette
          ? 'connect_and_screw_in_pipette'
          : 'connect_96_channel'
      )}
      rightHandBody={
        <Flex justifyContent={JUSTIFY_CENTER}>
          <img
            //  TODO(jr, 11/18/22): attach real image
            src={isSingleMountPipette ? screwPattern : attach96Pipette}
            width="171px"
            height="248px"
            alt={
              isSingleMountPipette
                ? 'Screw pattern'
                : 'Attach 96 channel pipette'
            }
          />
        </Flex>
      }
      bodyText={
        isSingleMountPipette ? (
          <Trans
            t={t}
            i18nKey="hold_onto_pipette"
            components={{
              block: <StyledText as="p" marginBottom="1rem" />,
            }}
          />
        ) : (
          <StyledText as="p"> {t('hold_pipette_carefully')}</StyledText>
        )
      }
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          proceed={proceed}
          robotName={robotName}
          proceedButtonText={capitalize(t('continue'))}
        />
      }
    />
  )
}
