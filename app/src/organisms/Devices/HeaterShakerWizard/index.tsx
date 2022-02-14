import * as React from 'react'
import { Portal } from '../../../App/portal'
import { Introduction } from './Introduction'
import { KeyParts } from './KeyParts'
import { AttachModule } from './AttachModule'
import { AttachAdapter } from './AttachAdapter'
import { PowerOn } from './PowerOn'
import { TestShake } from './TestShake'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ModalPage,
  PrimaryBtn,
  SecondaryBtn,
} from '@opentrons/components'

interface HeaterShakerWizardProps {
  onCloseClick: () => unknown
}

export const HeaterShakerWizard = (
  props: HeaterShakerWizardProps
): JSX.Element => {
  const { onCloseClick } = props
  const [currentPage, setCurrentPage] = React.useState(0)
  let buttonContent = null
  const getWizardDisplayPage = (): JSX.Element | null => {
    switch (currentPage) {
      case 0:
        buttonContent = 'Continue to attachment guide'
        return <Introduction />
      case 1:
        buttonContent = 'Begin attachment'
        return <KeyParts />
      case 2:
        buttonContent = 'Continue to attach thermal adapter'
        return <AttachModule />
      case 3:
        buttonContent = 'Continue to power on module'
        return <AttachAdapter />
      case 4:
        buttonContent = 'Continue to test shake'
        return <PowerOn />
      case 5:
        buttonContent = 'Complete'
        return <TestShake />
      default:
        return null
    }
  }

  return (
    <Portal level="top">
      <ModalPage
        titleBar={{
          title: 'Robot Name - Attach Heater Shaker Module',
          back: {
            onClick: () => onCloseClick(),
            title: 'Exit',
            children: 'Exit',
          },
        }}
      >
        {getWizardDisplayPage()}
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          {currentPage > 0 ? (
            <SecondaryBtn
              color={COLORS.blue}
              borderRadius={'3px'}
              alignItems={ALIGN_CENTER}
              data-testid={`wizard_back_btn`}
              onClick={() => setCurrentPage(currentPage => currentPage - 1)}
            >
              Back
            </SecondaryBtn>
          ) : null}
          {currentPage <= 5 ? (
            <PrimaryBtn
              backgroundColor={COLORS.blue}
              borderRadius={'3px'}
              alignItems={ALIGN_CENTER}
              data-testid={`wizard_next_btn`}
              onClick={
                currentPage === 5
                  ? () => onCloseClick()
                  : () => setCurrentPage(currentPage => currentPage + 1)
              }
            >
              {buttonContent}
            </PrimaryBtn>
          ) : null}
        </Flex>
      </ModalPage>
    </Portal>
  )
}
