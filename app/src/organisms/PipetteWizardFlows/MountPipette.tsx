import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  Btn,
  TEXT_ALIGN_LEFT,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import screwPatternPt2 from '../../assets/images/change-pip/screw-pattern-pt2.png'

import type { PipetteWizardStepProps } from './types'

export const MountPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const proceedButtonText: string = t('continue')
  const [showPipetteDetected, setShowPipetteDetected] = React.useState<boolean>(
    false
  )
  React.useEffect(() => {
    setTimeout(() => setShowPipetteDetected(true), 10000)
  }, [])

  //    TODO(jr, 11/2/22): wire up pipetteName which will be grabbed by attachedPipette
  //    prop. The prop is added in the PR that wires up the Calibration flow
  const pipetteName = 'P1000 Single-Channel GEN3'

  return showPipetteDetected ? (
    <GenericWizardTile
      header={t('name_and_volume_detected', {
        name: pipetteName,
      })}
      rightHandBody={
        <Flex justifyContent={JUSTIFY_CENTER}>
          {/* TODO(jr, 11/2/22): replace this image with correct graphic with screwdriver */}
          <img
            src={screwPatternPt2}
            width="321px"
            height="226px"
            alt="Screw pattern pt 2"
          />
        </Flex>
      }
      bodyText={<StyledText as="p"> {t('grab_screwdriver')}</StyledText>}
      proceedButtonText={proceedButtonText}
      proceed={proceed}
      back={goBack}
    />
  ) : (
    <GenericWizardTile
      header={t('mount_pipette')}
      rightHandBody={
        <Flex justifyContent={JUSTIFY_CENTER}>
          <img
            src={screwPattern}
            width="171px"
            height="248px"
            alt="Screw pattern"
          />
        </Flex>
      }
      bodyText={
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Trans
            t={t}
            i18nKey="hold_onto_pipette"
            components={{
              block: <StyledText as="p" marginBottom="1rem" />,
            }}
          />
          {/* TODO(Jr, 11/2/22): wire up this button to correct modal */}
          <Btn onClick={() => console.log('check connection')}>
            <StyledText
              textAlign={TEXT_ALIGN_LEFT}
              css={TYPOGRAPHY.linkPSemiBold}
            >
              {t('detach_and_reattach')}
            </StyledText>
          </Btn>
        </Flex>
      }
      proceedButtonText={proceedButtonText}
      back={goBack}
    />
  )
}
