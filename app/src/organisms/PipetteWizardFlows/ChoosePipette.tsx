import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import {
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  EIGHT_CHANNEL,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { Portal } from '../../App/portal'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import singleChannelAndEightChannel from '../../assets/images/change-pip/single-channel-and-eight-channel.png'
import { useAttachedPipettes } from '../Devices/hooks'
import { ExitModal } from './ExitModal'
import { FLOWS } from './constants'
import { getIsGantryEmpty } from './utils'

import type { PipetteMount } from '@opentrons/shared-data'
import type { SelectablePipettes } from './types'

interface ChoosePipetteProps {
  proceed: () => void
  selectedPipette: SelectablePipettes
  setSelectedPipette: React.Dispatch<React.SetStateAction<SelectablePipettes>>
  exit: () => void
  mount: PipetteMount
}
const UNSELECTED_OPTIONS_STYLE = css`
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
const SELECTED_OPTIONS_STYLE = css`
  ${UNSELECTED_OPTIONS_STYLE}
  border: 1px solid ${COLORS.blueEnabled};
  background-color: ${COLORS.lightBlue};

  &:hover {
    border: 1px solid ${COLORS.blueEnabled};
    background-color: ${COLORS.lightBlue};
  }
`
const ON_DEVICE_UNSELECTED_OPTIONS_STYLE = css`
  background-color: #cccccc;
  border-radius: ${BORDERS.size_four};
  padding: ${SPACING.spacing5};
  margin-bottom: ${SPACING.spacing3};
  height: 5.25rem;
  width: 57.8125rem;
`
const ON_DEVICE_SELECTED_OPTIONS_STYLE = css`
  ${ON_DEVICE_UNSELECTED_OPTIONS_STYLE}
  background-color: ${COLORS.highlightPurple_one};
  color: ${COLORS.white};
`
export const ChoosePipette = (props: ChoosePipetteProps): JSX.Element => {
  const { selectedPipette, setSelectedPipette, proceed, exit, mount } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('pipette_wizard_flows')
  const attachedPipettesByMount = useAttachedPipettes()
  const isGantryEmpty = getIsGantryEmpty(attachedPipettesByMount)
  const [setShowExit, showExit] = React.useState<boolean>(false)
  const proceedButtonText: string = t('next')
  const nintySixChannelWrapper =
    selectedPipette === NINETY_SIX_CHANNEL
      ? SELECTED_OPTIONS_STYLE
      : UNSELECTED_OPTIONS_STYLE
  const singleMountWrapper =
    selectedPipette === SINGLE_MOUNT_PIPETTES
      ? SELECTED_OPTIONS_STYLE
      : UNSELECTED_OPTIONS_STYLE
  const onDevice96Wrapper =
    selectedPipette === NINETY_SIX_CHANNEL
      ? ON_DEVICE_SELECTED_OPTIONS_STYLE
      : ON_DEVICE_UNSELECTED_OPTIONS_STYLE
  const onDeviceSingleMountWrapper =
    selectedPipette === SINGLE_MOUNT_PIPETTES
      ? ON_DEVICE_SELECTED_OPTIONS_STYLE
      : ON_DEVICE_UNSELECTED_OPTIONS_STYLE

  let ninetySix: string = t('ninety_six_channel', {
    ninetySix: NINETY_SIX_CHANNEL,
  })
  if (!isGantryEmpty) {
    ninetySix = t('detach_pipette_to_attach_96', {
      pipetteName:
        attachedPipettesByMount.right?.modelSpecs.displayName ??
        attachedPipettesByMount.left?.modelSpecs.displayName,
    })
  }
  const singleMount = t('single_or_8_channel', {
    single: '1-',
    eight: EIGHT_CHANNEL,
  })

  return isOnDevice ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      position={POSITION_ABSOLUTE}
    >
      <WizardHeader
        title={startCase(t('attach_pipette', { mount: mount }))}
        currentStep={0}
        totalSteps={3}
        onExit={setShowExit ? exit : () => showExit(true)}
      />
      {setShowExit ? (
        <ExitModal
          goBack={() => showExit(false)}
          proceed={exit}
          flowType={FLOWS.ATTACH}
          isOnDevice={isOnDevice}
        />
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingX={SPACING.spacing6}
          paddingY="1.75rem"
        >
          <StyledText
            fontSize="1.75rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginBottom={SPACING.spacing4}
          >
            {t('choose_pipette')}
          </StyledText>
          <Flex
            onClick={() => setSelectedPipette(SINGLE_MOUNT_PIPETTES)}
            css={onDeviceSingleMountWrapper}
            data-testid="ChoosePipette_SingleAndEight_OnDevice"
          >
            <StyledText
              fontSize="1.75rem"
              fontWeight={700}
              alignSelf={TYPOGRAPHY.textAlignCenter}
            >
              {singleMount}
            </StyledText>
          </Flex>
          <Flex
            onClick={() => setSelectedPipette(NINETY_SIX_CHANNEL)}
            css={onDevice96Wrapper}
            data-testid="ChoosePipette_NinetySix_OnDevice"
          >
            <StyledText
              fontSize="1.75rem"
              fontWeight={700}
              alignSelf={TYPOGRAPHY.textAlignCenter}
            >
              {ninetySix}
            </StyledText>
          </Flex>
        </Flex>
      )}
      <Flex
        alignItems={ALIGN_FLEX_END}
        paddingX={SPACING.spacing6}
        paddingBottom="1.75rem"
        justifyContent={JUSTIFY_FLEX_END}
        marginTop="7.5rem"
      >
        <SmallButton
          onClick={proceed}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          buttonText={t('continue')}
          buttonType="default"
        />
      </Flex>
    </Flex>
  ) : (
    <Portal level="top">
      <ModalShell
        width="47rem"
        height="30rem"
        header={
          <WizardHeader
            title={startCase(t('attach_pipette', { mount: mount }))}
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
            isOnDevice={null}
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
                  textAlign={TYPOGRAPHY.textAlignCenter}
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
                  textAlign={TYPOGRAPHY.textAlignCenter}
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
