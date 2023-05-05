import React from 'react'
import cx from 'classnames'
import { Flex, RadioGroup } from '@opentrons/components'
import { blockMount, pipetteSlot } from '../constant'
import { StyledText } from '../StyledText'
import { RadioSelect } from './RadioSelect'
import { i18n } from '../../../localization'
import styles from '../FlexComponents.css'
import { useFormikContext } from 'formik'
import { TipRackOptions } from './TipRackList'

interface SelectPipetteOptionProps {
  pipetteName: string
}

export const SelectPipetteOption: React.FC<SelectPipetteOptionProps> = ({
  pipetteName,
}) => {
  const {
    values: { pipettesByMount },
  } = useFormikContext<any>()

  const is96ChannelSelected = checkSelectedPipette(
    pipettesByMount[pipetteName].pipetteName
  )
  const className = cx({ disable_mount_option: is96ChannelSelected })

  const pipetteHeaderText =
    pipetteSlot.left === pipetteName
      ? i18n.t('flex.pipette_selection.choose_first_pipette')
      : i18n.t('flex.pipette_selection.choose_second_pipette')
  return (
    <>
      <StyledText as={'h1'}>{pipetteHeaderText}</StyledText>
      {
        <>
          <StyledText as={'p'}>
            {i18n.t('flex.pipette_selection.pipette_96_selection_note')}
          </StyledText>
          {/* Pipette Selection here */}
          <RadioSelect
            pipetteName={`pipettesByMount.${pipetteName}.pipetteName`}
            pipetteType={pipettesByMount[pipetteName].pipetteName}
          />
          <hr />
          {/* Pipette Mount Selection here */}
          <Flex className={styles[className]}>
            <SelectPipetteMount pipetteName={pipetteName} />
          </Flex>
          {channel96SelectionNote(is96ChannelSelected)}
          <hr />
          <TipRackOptions pipetteName={pipetteName} />
        </>
      }
    </>
  )
}

const checkSelectedPipette = (pipetteName: string): boolean => {
  return blockMount.includes(pipetteName)
}

const channel96SelectionNote = (
  is96ChannelSelected: boolean
): JSX.Element | boolean => {
  return (
    is96ChannelSelected && (
      <StyledText as={'p'}>
        {i18n.t('flex.pipette_selection.pippette_ocuupies_both_mount')}
      </StyledText>
    )
  )
}

const SelectPipetteMount = (props: { pipetteName: string }): JSX.Element => {
  const {
    values: { pipettesByMount, mountSide },
    handleChange,
  } = useFormikContext<any>()

  return (
    <>
      {
        <RadioGroup
          inline
          name={`pipettesByMount.${props.pipetteName}.mount`}
          value={pipettesByMount[props.pipetteName].mount}
          options={mountSide}
          onChange={handleChange}
        />
      }
    </>
  )
}
