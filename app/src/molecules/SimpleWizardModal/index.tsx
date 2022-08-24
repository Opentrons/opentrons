import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { ModalShell } from '../Modal'
import { WizardHeader } from '../WizardHeader'

interface Props {
  iconColor: string
  children: React.ReactNode
  header: string
  subHeader: string
  isSuccess: boolean
  onExit: () => void
  title: string
  currentStep: number
  totalSteps: number
}

export function SimpleWizardModal(props: Props): JSX.Element {
  const {
    iconColor,
    children,
    header,
    subHeader,
    isSuccess,
    onExit,
    title,
    currentStep,
    totalSteps,
  } = props

  return (
    <ModalShell width="47rem" height="28.12rem">
      <Flex flexDirection={DIRECTION_COLUMN}>
        <WizardHeader
          currentStep={currentStep}
          totalSteps={totalSteps}
          title={title}
          onExit={onExit}
        />
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
            height="100%"
            marginTop="6.8rem"
            marginBottom="5.68rem"
          >
            <Icon
              name={isSuccess ? 'ot-check' : 'ot-alert'}
              size="4rem"
              color={iconColor}
              aria-label={isSuccess ? 'ot-check' : 'ot-alert'}
            />
            <StyledText
              as="h1"
              marginTop={SPACING.spacing5}
              marginBottom={SPACING.spacing3}
            >
              {header}
            </StyledText>
            <StyledText as="p">{subHeader}</StyledText>
          </Flex>
          <Flex
            paddingX={SPACING.spacing6}
            paddingBottom={SPACING.spacing6}
            justifyContent={JUSTIFY_FLEX_END}
          >
            {children}
          </Flex>
        </Flex>
      </Flex>
    </ModalShell>
  )
}
