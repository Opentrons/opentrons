import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import {
  EIGHT_CHANNEL,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import singleChannelAndEightChannel from '../../assets/images/change-pip/single-channel-and-eight-channel.png'

import type { PipetteWizardStepProps, SelectablePipettes } from './types'

const unselectedOptionStyles = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3};
  margin-bottom: ${SPACING.spacing3};
  width: 100%;
  cursor: pointer;

  &:hover {
    border: 1px solid ${COLORS.medGreyHover};
  }
`
const selectedOptionStyles = css`
  ${unselectedOptionStyles}
  border: 1px solid ${COLORS.blueEnabled};
  background-color: ${COLORS.lightBlue};

  &:hover {
    border: 1px solid ${COLORS.blueEnabled};
    background-color: ${COLORS.lightBlue};
  }
`

export const ChoosePipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)
  const proceedButtonText: string = t('attach_this_pipette')

  const nintySixChannelWrapper =
    selectedPipette === NINETY_SIX_CHANNEL
      ? selectedOptionStyles
      : unselectedOptionStyles
  const singleMountWrapper =
    selectedPipette === SINGLE_MOUNT_PIPETTES
      ? selectedOptionStyles
      : unselectedOptionStyles

  const ninetySix = t('ninety_six_channel', { ninetySix: NINETY_SIX_CHANNEL })
  const singleMount = t('single_or_8_channel', {
    single: 'Single',
    eight: EIGHT_CHANNEL,
  })

  return (
    <GenericWizardTile
      header={t('choose_pipette')}
      rightHandBody={
        <Flex
          onClick={() => setSelectedPipette(NINETY_SIX_CHANNEL)}
          css={nintySixChannelWrapper}
          height="14.5625rem"
          width="14.5625rem"
          alignSelf={ALIGN_FLEX_END}
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
          data-testid="ChoosePipette_NinetySix"
        >
          <Flex justifyContent={JUSTIFY_CENTER}>
            <img
              //  TODO(jr, 11/2/22): change this image to the correct 96 channel pipette image
              src={singleChannelAndEightChannel}
              width="138.78px"
              height="160px"
              alt={ninetySix}
            />
          </Flex>
          <StyledText css={TYPOGRAPHY.h3SemiBold} textAlign={TEXT_ALIGN_CENTER}>
            {ninetySix}
          </StyledText>
        </Flex>
      }
      bodyText={
        <Flex
          onClick={() => setSelectedPipette(SINGLE_MOUNT_PIPETTES)}
          css={singleMountWrapper}
          height="14.5625rem"
          width="14.5625rem"
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
          data-testid="ChoosePipette_SingleAndEight"
        >
          <Flex justifyContent={JUSTIFY_CENTER}>
            <img
              src={singleChannelAndEightChannel}
              width="138.78px"
              height="160px"
              alt={singleMount}
            />
          </Flex>
          <StyledText css={TYPOGRAPHY.h3SemiBold} textAlign={TEXT_ALIGN_CENTER}>
            {singleMount}
          </StyledText>
        </Flex>
      }
      proceedButtonText={proceedButtonText}
      proceed={proceed}
    />
  )
}
