import React, { useEffect, useState } from 'react'
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
  changeIs96Selected: (arg: boolean) => unknown
  isLeft96ChannelSelected: boolean
}

interface formikContextProps {
  pipettesByMount: {
    [key: string]: {
      tiprackDefURI: []
      pipetteName: string
      isSelected: boolean
    }
  }
  pipette: any
}

export const SelectPipetteOption: React.FC<SelectPipetteOptionProps> = ({
  pipetteName,
  changeIs96Selected,
  isLeft96ChannelSelected,
}) => {
  const { values, errors } = useFormikContext<formikContextProps>()
  const { pipettesByMount } = values
  const { pipettesByMount: pipettesByMountError = {} } = errors
  const is96ChannelSelected = checkSelectedPipette(
    pipettesByMount[pipetteName].pipetteName
  )

  if (isLeft96ChannelSelected) {
    values.pipettesByMount.right.pipetteName = ''
    values.pipettesByMount.right.tiprackDefURI = []
  } else if (
    values.pipettesByMount?.right?.pipetteName === 'LEAVE_SECOND_EMPTY'
  ) {
    values.pipettesByMount.right.tiprackDefURI = []
  }

  const [isLeaveMountEmpty, setIsLeaveMountEmpty] = useState(true)
  useEffect(() => {
    if (pipetteSlot.left === pipetteName) {
      changeIs96Selected(is96ChannelSelected)
    }
  }, [pipetteSlot.left, pipetteName, changeIs96Selected, is96ChannelSelected])

  useEffect(() => {
    if (values.pipettesByMount?.right?.pipetteName === 'LEAVE_SECOND_EMPTY') {
      setIsLeaveMountEmpty(true)
    } else {
      setIsLeaveMountEmpty(false)
    }
  }, [values.pipettesByMount, isLeaveMountEmpty])

  const className = cx({ disable_mount_option: is96ChannelSelected })

  const pipetteHeaderText =
    pipetteSlot.left === pipetteName
      ? i18n.t('flex.pipette_selection.choose_first_pipette')
      : i18n.t('flex.pipette_selection.choose_second_pipette')
  return (
    <div>
      <Flex className={styles.margin_10}>
        <StyledText as={'h2'}>{pipetteHeaderText}</StyledText>
      </Flex>
      {
        <>
          <StyledText as={'p'} className={styles.margin_10}>
            {i18n.t('flex.pipette_selection.pipette_96_selection_note')}
          </StyledText>
          {/* Pipette Selection here */}
          <Flex
            className={
              pipetteName === pipetteSlot.left
                ? styles.margin_10
                : !isLeft96ChannelSelected
                ? styles.margin_10
                : styles.disable_mount_option
            }
          >
            <RadioSelect
              pipetteName={`pipettesByMount.${pipetteName}.pipetteName`}
              pipetteType={pipettesByMount[pipetteName].pipetteName}
            />
          </Flex>
          {pipetteName === pipetteSlot.left && (
            <StyledText as="label" className={styles.error_text}>
              {pipettesByMountError.left?.pipetteName &&
                pipettesByMountError.left.pipetteName}
            </StyledText>
          )}
          {/* Pipette Mount Selection here */}
          <hr />
          {!is96ChannelSelected ? (
            <>
              <Flex className={cx(styles[className], styles.ptb_10)}>
                <SelectPipetteMount
                  pipetteName={pipetteName}
                  is96ChannelSelected={isLeft96ChannelSelected}
                />
              </Flex>
            </>
          ) : (
            <>{channel96SelectionNote(is96ChannelSelected)}</>
          )}

          <hr />
          <div className={styles.margin_10}>
            <TipRackOptions
              pipetteName={pipetteName}
              isLeft96ChannelSelected={isLeft96ChannelSelected}
              isLeaveMountEmpty={isLeaveMountEmpty}
            />
          </div>
        </>
      }
    </div>
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
      <StyledText as={'p'} className={styles.ptb_10}>
        {i18n.t('flex.pipette_selection.pippette_ocuupies_both_mount')}
      </StyledText>
    )
  )
}

const SelectPipetteMount = (props: {
  pipetteName: string
  is96ChannelSelected: boolean
}): JSX.Element => {
  const {
    values: { pipettesByMount, mountSide },
    handleChange,
    handleBlur,
  } = useFormikContext<any>()
  return (
    <>
      {props.pipetteName === 'left' ? (
        <>
          <RadioGroup
            inline
            name={`pipettesByMount.${props.pipetteName}.mount`}
            value={pipettesByMount[props.pipetteName].mount}
            options={mountSide}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </>
      ) : props.is96ChannelSelected ? (
        <StyledText as={'p'} className={styles.ptb_10}>
          {i18n.t('flex.pipette_selection.pippette_ocuupies_both_mount')}
        </StyledText>
      ) : pipettesByMount[pipetteSlot.left].mount === 'left' ? (
        <StyledText as={'p'} className={styles.ptb_10}>
          {i18n.t('flex.pipette_selection.right_pipette_display')}
        </StyledText>
      ) : (
        <StyledText as={'p'} className={styles.ptb_10}>
          {i18n.t('flex.pipette_selection.left_pipette_display')}
        </StyledText>
      )}
    </>
  )
}
