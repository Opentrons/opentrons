import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Portal } from '../../../App/portal'
import { useSelector } from 'react-redux'
import { getConnectedRobotName } from '../../../redux/robot/selectors'
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
  TEXT_TRANSFORM_NONE,
} from '@opentrons/components'

import type { State } from '../../../redux/types'

interface HeaterShakerWizardProps {
  onCloseClick: () => unknown
}

export const HeaterShakerWizard = (
  props: HeaterShakerWizardProps
): JSX.Element => {
  const { onCloseClick } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [currentPage, setCurrentPage] = React.useState(0)
  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  let buttonContent = null
  const getWizardDisplayPage = (): JSX.Element | null => {
    switch (currentPage) {
      case 0:
        buttonContent = t('btn_continue_attachment_guide')
        return (
          <Introduction
            labwareDefinition="plate"
            thermalAdapterName="adapter"
          />
        )
      case 1:
        buttonContent = t('btn_begin_attachment')
        return <KeyParts />
      case 2:
        buttonContent = t('btn_thermal_adapter')
        return <AttachModule slotName={'1'} />
      case 3:
        buttonContent = t('btn_power_module')
        return <AttachAdapter />
      case 4:
        buttonContent = t('btn_test_shake')
        return <PowerOn status={'on'} />
      case 5:
        buttonContent = t('complete')
        return <TestShake />
      default:
        return null
    }
  }

  return (
    <Portal level="top">
      <ModalPage
        titleBar={{
          title: t('modal_title', { name: robotName }),
          back: {
            onClick: () => onCloseClick(),
            title: t('shared:exit'),
            children: t('shared:exit'),
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
              alignItems={ALIGN_CENTER}
              color={COLORS.blue}
              borderRadius={'3px'}
              textTransform={TEXT_TRANSFORM_NONE}
              data-testid={`wizard_back_btn`}
              onClick={() => setCurrentPage(currentPage => currentPage - 1)}
            >
              {t('back')}
            </SecondaryBtn>
          ) : null}
          {currentPage <= 5 ? (
            <PrimaryBtn
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.blue}
              borderRadius={'3px'}
              textTransform={TEXT_TRANSFORM_NONE}
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
