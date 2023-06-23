import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  RESPONSIVENESS,
  DIRECTION_ROW,
  JUSTIFY_FLEX_START,
  PrimaryButton,
  ALIGN_FLEX_END,
  ALIGN_CENTER,
  JUSTIFY_SPACE_AROUND,
} from '@opentrons/components'
import {
  EIGHT_CHANNEL,
  NINETY_SIX_CHANNEL,
  RIGHT,
  LEFT,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { i18n } from '../../i18n'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { Portal } from '../../App/portal'
import { SmallButton } from '../../atoms/buttons'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import singleChannelAndEightChannel from '../../assets/images/change-pip/1_and_8_channel.png'
import ninetySixChannel from '../../assets/images/change-pip/ninety-six-channel.png'
import { useAttachedPipettesFromInstrumentsQuery } from '../Devices/hooks'
import { ExitModal } from './ExitModal'
import { FLOWS } from './constants'
import { getIsGantryEmpty } from './utils'

import type { StyleProps } from '@opentrons/components'
import type { PipetteMount } from '@opentrons/shared-data'
import type { SelectablePipettes } from './types'

const UNSELECTED_OPTIONS_STYLE = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  height: 14.5625rem;
  width: 14.5625rem;
  cursor: pointer;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8}

  &:hover {
    border: 1px solid ${COLORS.medGreyHover};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    flex-direction: ${DIRECTION_ROW};
    justify-content: ${JUSTIFY_FLEX_START};
    background-color: ${COLORS.mediumBlueEnabled};
    border-width: 0; 
    border-radius: ${BORDERS.borderRadiusSize4};
    padding: ${SPACING.spacing24};
    height: 5.25rem;
    width: 57.8125rem;

    &:hover {
      border-width: 0px;
    }
  }
`
const SELECTED_OPTIONS_STYLE = css`
  ${UNSELECTED_OPTIONS_STYLE}
  border: 1px solid ${COLORS.blueEnabled};
  background-color: ${COLORS.lightBlue};

  &:hover {
    border: 1px solid ${COLORS.blueEnabled};
    background-color: ${COLORS.lightBlue};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-width: 0px;
    background-color: ${COLORS.blueEnabled};
    color: ${COLORS.white};

    &:hover {
      border-width: 0px;
      background-color: ${COLORS.blueEnabled};
    }
  }
`

interface ChoosePipetteProps {
  proceed: () => void
  selectedPipette: SelectablePipettes
  setSelectedPipette: React.Dispatch<React.SetStateAction<SelectablePipettes>>
  exit: () => void
  mount: PipetteMount
}
export const ChoosePipette = (props: ChoosePipetteProps): JSX.Element => {
  const { selectedPipette, setSelectedPipette, proceed, exit, mount } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const attachedPipettesByMount = useAttachedPipettesFromInstrumentsQuery()
  const [
    showExitConfirmation,
    setShowExitConfirmation,
  ] = React.useState<boolean>(false)

  const bothMounts = getIsGantryEmpty(attachedPipettesByMount)
    ? t('ninety_six_channel', {
        ninetySix: NINETY_SIX_CHANNEL,
      })
    : t('detach_pipette_to_attach_96', {
        pipetteName:
          attachedPipettesByMount[LEFT]?.displayName ??
          attachedPipettesByMount[RIGHT]?.displayName,
      })

  const singleMount = t('single_or_8_channel', {
    single: '1-',
    eight: EIGHT_CHANNEL,
  })
  const wizardHeader = (
    <WizardHeader
      title={startCase(t('attach_pipette', { mount: mount }))}
      currentStep={0}
      totalSteps={3}
      onExit={showExitConfirmation ? exit : () => setShowExitConfirmation(true)}
    />
  )
  return (
    <Portal level="top">
      {isOnDevice ? (
        <LegacyModalShell height="100%" header={wizardHeader}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            width="100%"
            position={POSITION_ABSOLUTE}
            backgroundColor={COLORS.white}
          >
            {showExitConfirmation ? (
              <ExitModal
                goBack={() => setShowExitConfirmation(false)}
                proceed={exit}
                flowType={FLOWS.ATTACH}
                isOnDevice={isOnDevice}
              />
            ) : (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                padding={SPACING.spacing32}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                height="29.5rem"
              >
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing8}
                >
                  <StyledText
                    as="h4"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    marginBottom={SPACING.spacing4}
                  >
                    {t('choose_pipette')}
                  </StyledText>
                  <PipetteMountOption
                    isSelected={selectedPipette === SINGLE_MOUNT_PIPETTES}
                    onClick={() => setSelectedPipette(SINGLE_MOUNT_PIPETTES)}
                  >
                    <StyledText
                      as="h4"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {singleMount}
                    </StyledText>
                  </PipetteMountOption>
                  <PipetteMountOption
                    isSelected={selectedPipette === NINETY_SIX_CHANNEL}
                    onClick={() => setSelectedPipette(NINETY_SIX_CHANNEL)}
                  >
                    <StyledText
                      as="h4"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {bothMounts}
                    </StyledText>
                  </PipetteMountOption>
                </Flex>
                <Flex justifyContent={JUSTIFY_FLEX_END}>
                  <SmallButton
                    onClick={proceed}
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                    buttonText={i18n.format(t('shared:continue'), 'capitalize')}
                    buttonType="primary"
                  />
                </Flex>
              </Flex>
            )}
          </Flex>
        </LegacyModalShell>
      ) : (
        <LegacyModalShell width="47rem" height="30rem" header={wizardHeader}>
          {showExitConfirmation ? (
            <ExitModal
              goBack={() => setShowExitConfirmation(false)}
              proceed={exit}
              flowType={FLOWS.ATTACH}
              isOnDevice={isOnDevice}
            />
          ) : (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              padding={SPACING.spacing40}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText as="h1">{t('choose_pipette')}</StyledText>
                <Flex
                  margin={SPACING.spacing40}
                  justifyContent={JUSTIFY_SPACE_AROUND}
                >
                  <PipetteMountOption
                    isSelected={selectedPipette === SINGLE_MOUNT_PIPETTES}
                    onClick={() => setSelectedPipette(SINGLE_MOUNT_PIPETTES)}
                  >
                    <img
                      src={singleChannelAndEightChannel}
                      width="138.78px"
                      height="160px"
                      alt={singleMount}
                    />
                    <StyledText
                      as="h3"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                      textAlign={TYPOGRAPHY.textAlignCenter}
                    >
                      {singleMount}
                    </StyledText>
                  </PipetteMountOption>
                  <PipetteMountOption
                    isSelected={selectedPipette === NINETY_SIX_CHANNEL}
                    onClick={() => setSelectedPipette(NINETY_SIX_CHANNEL)}
                  >
                    <img
                      src={ninetySixChannel}
                      width="138.78px"
                      height="160px"
                      alt={bothMounts}
                    />
                    <StyledText
                      as="h3"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                      textAlign={TYPOGRAPHY.textAlignCenter}
                    >
                      {bothMounts}
                    </StyledText>
                  </PipetteMountOption>
                </Flex>
              </Flex>
              <PrimaryButton onClick={proceed} alignSelf={ALIGN_FLEX_END}>
                {i18n.format(t('shared:continue'), 'capitalize')}
              </PrimaryButton>
            </Flex>
          )}
        </LegacyModalShell>
      )}
    </Portal>
  )
}

interface PipetteMountOptionProps extends StyleProps {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
}
function PipetteMountOption(props: PipetteMountOptionProps): JSX.Element {
  const { isSelected, onClick, children, ...styleProps } = props
  return (
    <Flex
      onClick={onClick}
      css={isSelected ? SELECTED_OPTIONS_STYLE : UNSELECTED_OPTIONS_STYLE}
      {...styleProps}
    >
      {children}
    </Flex>
  )
}
