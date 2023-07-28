import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { restartRobot } from '../../redux/robot-admin'

import { Dispatch } from '../../redux/types'
import { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import { useChainCommandsOnce } from '../../resources/runs/hooks'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { CreateCommand, LoadLabwareCreateCommand, LoadPipetteCreateCommand } from '@opentrons/shared-data'
import { Mount } from '@opentrons/api-client'

interface GantryControlModalProps {
  robotName: string
  close: () => void
}
export function GantryControlModal({
  robotName,
  close,
}: GantryControlModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['robot_controls', 'shared'])
  const { chainCommandsOnce } = useChainCommandsOnce()
  const { data: instrumentsQueryData, isLoading: isLoadingInstruments } = useInstrumentsQuery()

  const modalHeader: ModalHeaderBaseProps = {
    title: t('control_gantry'),
    iconName: 'move-xy',
    iconColor: COLORS.darkGreyEnabled,
  }

  const handleHome = (): void => {
    chainCommandsOnce([
      { commandType: 'home' as const, params: {} }
    ], true)
      .then(() => {
        console.log('TODO: handle command complete')
      })
      .catch(error => {
        console.error(error.message)
        console.log('TODO: handle command complete')
      })
  }

  const handleDropAllTips = (): void => {
    const pipetteCommands = (instrumentsQueryData?.data ?? []).reduce<CreateCommand[]>((acc, i) => {
      if (i.instrumentType === "pipette" && i.ok === true) {
        return [
          ...acc,
          {
            commandType: 'loadPipette',
            params: {
              pipetteName: i.instrumentName,
              mount: i.mount as Mount,
              pipetteId: i.mount
            }
          },
          {
            commandType: 'retractAxis',
            params: {
              axis: i.mount === 'left' ? 'leftZ' : 'rightZ',
            },
          },
          {
            commandType: 'moveToCoordinates',
            params: {pipetteId: i.mount, coordinates: {x:80, y: 80, z:200}}
          }
        ]
      }
      return acc
    }, [])
    chainCommandsOnce([
      { commandType: 'home' as const, params: {} },
      ...pipetteCommands,
    ], true)
      .then(() => {
        console.log('TODO: handle command complete')
      })
      .catch(error => {
        console.error(error.message)
        console.log('TODO: handle command complete')
      })
  }

  return (
    <Modal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Trans
          t={t}
          i18nKey="restart_robot_confirmation_description"
          values={{ robotName: robotName }}
          components={{
            bold: <strong />,
            span: (
              <StyledText
                as="p"
                data-testid="restart_robot_confirmation_description"
              />
            ),
          }}
        />
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonText={t('shared:go_back')}
            onClick={close}
          />
          <SmallButton
            flex="1"
            buttonType="primary"
            buttonText={i18n.format(t('home_gantry'), 'capitalize')}
            disabled={isLoadingInstruments}
            onClick={handleHome}
          />
          <SmallButton
            flex="1"
            buttonType="primary"
            buttonText={i18n.format(t('drop_all_tips'), 'capitalize')}
            disabled={isLoadingInstruments}
            onClick={handleDropAllTips}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
