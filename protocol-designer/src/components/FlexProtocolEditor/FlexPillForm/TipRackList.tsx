import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { useFormikContext } from 'formik'
import {
  blockedTipRackListForFlex,
  customTiprackOption,
  fontSize14,
  pipetteSlot,
} from '../constant'
import {
  CheckboxField,
  DropdownOption,
  Flex,
  OutlineButton,
} from '@opentrons/components'
import { i18n } from '../../../localization'
import {
  createCustomTiprackDef,
  removeCustomTiprackFile,
} from '../../../labware-defs/actions'
import { StyledText } from '../StyledText'
import cx from 'classnames'

import styles from '../FlexComponents.css'
import { reduce } from 'lodash'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'

interface formikContextProps {
  pipettesByMount: {
    [key: string]: {
      pipetteName: string
      tiprackDefURI: []
    }
  }
  pipette: any
  isLeft96ChannelSelected: boolean
}

export const TipRackOptions = ({
  pipetteName,
  isLeft96ChannelSelected,
  isLeaveMountEmpty,
}: any): JSX.Element => {
  const dispatch = useDispatch()
  const allLabware = useSelector(getLabwareDefsByURI)
  const tiprackOptions = getFlexTiprackOptions(allLabware)
  const [selected, setSelected] = useState<string[]>([])
  const [isLeaveMountEmptyStatus, setIsLeaveMountEmpty] = useState(true)
  useEffect(() => {
    setIsLeaveMountEmpty(isLeaveMountEmpty)
  }, [isLeaveMountEmpty])

  const {
    values,
    errors,
    setFieldValue,
  } = useFormikContext<formikContextProps>()
  const customTiprackFilteredData = [...tiprackOptions].filter(
    (i: any) =>
      i.namespace !== 'opentrons' && i.namespace !== customTiprackOption.value
  )

  const handleNameChange = (selected: string[]): any => {
    setFieldValue(`pipettesByMount.${pipetteName}.tiprackDefURI`, selected)
  }
  const latestTipRackList = values.pipettesByMount[pipetteName].tiprackDefURI
  useEffect(() => {
    setSelected(latestTipRackList)
  }, [latestTipRackList])

  return (
    <>
      <section
        className={
          pipetteName === pipetteSlot.left ||
          (!isLeaveMountEmptyStatus && pipetteName === pipetteSlot.left) ||
          (!isLeft96ChannelSelected &&
            !isLeaveMountEmptyStatus &&
            !isLeaveMountEmptyStatus)
            ? styles.margin_10
            : styles.disable_mount_option
        }
      >
        {tiprackOptions.map(({ name, value }: any, index: number) => {
          const isChecked = selected.includes(value)
          return (
            <CheckboxField
              key={index}
              label={name}
              name={name}
              value={isChecked}
              onChange={(e: any) => {
                const { checked } = e.currentTarget
                if (checked) {
                  const tiprackCheckedData = [...selected, ...[value]]
                  setSelected(tiprackCheckedData)
                  handleNameChange(tiprackCheckedData)
                } else {
                  const indexToRemove = selected.indexOf(value)
                  indexToRemove !== -1 && selected.splice(indexToRemove, 1)
                  setSelected(selected)
                  handleNameChange(selected)
                }
              }}
            ></CheckboxField>
          )
        })}
      </section>

      {customTiprackFilteredData.length > 0 && (
        <ShowCustomTiprackList
          customTipRackProps={customTiprackFilteredData}
          dispatchProps={dispatch}
        />
      )}
      <Flex>
        {pipetteName !== pipetteSlot.right &&
          customFileUpload(customTiprackFilteredData, dispatch)}
      </Flex>
      {pipetteName === pipetteSlot.left && (
        <StyledText as="label" className={styles.error_text}>
          {errors?.pipettesByMount?.left?.tiprackDefURI}
        </StyledText>
      )}
    </>
  )
}

function customFileUpload(
  customTiprackFilteredData: any[],
  dispatch: any
): JSX.Element {
  return (
    <OutlineButton
      Component="label"
      className={styles.custom_tiprack_upload_file}
    >
      {customTiprackFilteredData.length === 0
        ? i18n.t('button.upload_custom_tip_rack')
        : i18n.t('button.add_another_custom_tiprack')}
      <input
        type="file"
        onChange={e => {
          dispatch(createCustomTiprackDef(e))
        }}
      />
    </OutlineButton>
  )
}

function ShowCustomTiprackList({
  customTipRackProps,
  dispatchProps,
}: any): JSX.Element {
  const removeCustomTipRackFile = (customFile: string): void => {
    dispatchProps(removeCustomTiprackFile(customFile))
  }
  return (
    <Flex className={styles.filter_data}>
      {customTipRackProps.map(({ name, value }: any, index: number) => {
        return (
          <Flex className={styles.custom_tiprack} key={index}>
            <StyledText as="p" className={fontSize14}>
              {name}
            </StyledText>
            {'   '}
            <StyledText
              as="p"
              className={cx(styles.remove_button, fontSize14)}
              onClick={() => removeCustomTipRackFile(value)}
            >
              {i18n.t('button.remove_custom_tiprack')}
            </StyledText>
          </Flex>
        )
      })}
    </Flex>
  )
}

export const getFlexTiprackOptions = (allLabware: any): any => {
  type Values<T> = T[keyof T]
  const tiprackOptions = reduce<typeof allLabware, DropdownOption[]>(
    allLabware,
    (acc, def: Values<typeof allLabware>) => {
      if (def.metadata.displayCategory !== 'tipRack') return acc
      return [
        ...acc,
        {
          name: getLabwareDisplayName(def),
          value: getLabwareDefURI(def),
          namespace: def.namespace,
        },
      ]
    },
    []
  )
  const filteredTiprackOptions = tiprackOptions.filter(
    ({ name }): any => !blockedTipRackListForFlex.includes(name)
  )
  return filteredTiprackOptions
}
