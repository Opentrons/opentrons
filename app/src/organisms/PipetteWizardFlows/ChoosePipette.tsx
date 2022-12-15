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
import { Portal } from '../../App/portal'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import singleChannelAndEightChannel from '../../assets/images/change-pip/single-channel-and-eight-channel.png'
import { ExitModal } from './ExitModal'
import { FLOWS } from './constants'

import type { SelectablePipettes } from './types'

interface ChoosePipetteProps {
  proceed: () => void
  selectedPipette: SelectablePipettes
  setSelectedPipette: React.Dispatch<React.SetStateAction<SelectablePipettes>>
  exit: () => void
}
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

export const ChoosePipette = (props: ChoosePipetteProps): JSX.Element => {
  const { selectedPipette, setSelectedPipette, proceed, exit } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const [setShowExit, showExit] = React.useState<boolean>(false)
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
    <Portal level="top">
      <ModalShell
        width="47rem"
        height="30rem"
        header={
          <WizardHeader
            title={t('attach_pipette')}
            currentStep={0}
            totalSteps={3}
            onExit={setShowExit ? exit : () => showExit(true)}
          />
        }
      >
        {setShowExit ? (
          <ExitModal
            goBack={() => showExit(false)}
            proceed={exit}
            flowType={FLOWS.ATTACH}
          />
        ) : (
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
                <StyledText
                  css={TYPOGRAPHY.h3SemiBold}
                  textAlign={TEXT_ALIGN_CENTER}
                >
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
                <StyledText
                  css={TYPOGRAPHY.h3SemiBold}
                  textAlign={TEXT_ALIGN_CENTER}
                >
                  {singleMount}
                </StyledText>
              </Flex>
            }
            proceedButtonText={proceedButtonText}
            proceed={() => proceed()}
          />
        )}
      </ModalShell>
    </Portal>
  )
}
