import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { LargeButton, MediumButton, SmallButton } from '../../atoms/buttons'
import { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import { useChainCommandsOnce } from '../../resources/runs/hooks'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { CreateCommand } from '@opentrons/shared-data'
import { Mount } from '@opentrons/api-client'
import { JogControls } from '../../molecules/JogControls'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'
import { Portal } from '../../App/portal'

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

  // const modalHeader: ModalHeaderBaseProps = {
  //   title: i18n.format(t('control_gantry'), 'titleCase'),
  //   iconName: 'move-xy',
  //   iconColor: COLORS.darkGreyEnabled,
  //   hasExitIcon: true,
  // }

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

  // const handleDropAllTips = (): void => {
  //   const pipetteCommands = (instrumentsQueryData?.data ?? []).reduce<CreateCommand[]>((acc, i) => {
  //     if (i.instrumentType === "pipette" && i.ok === true) {
  //       return [
  //         ...acc,
  //         {
  //           commandType: 'loadPipette',
  //           params: {
  //             pipetteName: i.instrumentName,
  //             mount: i.mount as Mount,
  //             pipetteId: i.mount
  //           }
  //         },
  //         {
  //           commandType: 'retractAxis',
  //           params: {
  //             axis: i.mount === 'left' ? 'leftZ' : 'rightZ',
  //           },
  //         },
  //         {
  //           commandType: 'moveToCoordinates',
  //           params: { pipetteId: i.mount, coordinates: { x: 80, y: 80, z: 200 } }
  //         }
  //       ]
  //     }
  //     return acc
  //   }, [])
  //   chainCommandsOnce([
  //     { commandType: 'home' as const, params: {} },
  //     ...pipetteCommands,
  //   ], true)
  //     .then(() => {
  //       console.log('TODO: handle command complete')
  //     })
  //     .catch(error => {
  //       console.error(error.message)
  //       console.log('TODO: handle command complete')
  //     })
  // }

  return (
    <Portal level="top">
      <LegacyModalShell
        width="60rem"
        height="33.5rem"
        padding={SPACING.spacing16}
        display="flex"
        zIndex="1000"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        header={
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <Flex
              onClick={close}
              aria-label="closeIcon"
              alignItems={ALIGN_CENTER}
            >
              <Icon size="3.5rem" name="ot-close" />
            </Flex>
          </Flex>
        }
      >
        <JogControls
          jog={(axis, direction, step, _onSuccess) =>
            // handleJog(axis, direction, step, setJoggedPosition)
            console.log('TODO. jog')
          }
          isOnDevice={true}
        />
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <LargeButton
            flex="1"
            iconName='home-gantry'
            buttonType="secondary"
            buttonText={i18n.format(t('home_label'), 'capitalize')}
            disabled={isLoadingInstruments}
            onClick={handleHome}
          />
        </Flex>
      </LegacyModalShell>
    </Portal>
  )
}
