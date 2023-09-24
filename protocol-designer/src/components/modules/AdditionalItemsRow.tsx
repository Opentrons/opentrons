import * as React from 'react'
import styled from 'styled-components'
import { FLEX_ROBOT_TYPE, WASTE_CHUTE_SLOT } from '@opentrons/shared-data'
import {
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  LabeledValue,
  SPACING,
  SlotMap,
} from '@opentrons/components'
import { i18n } from '../../localization'
import gripperImage from '../../images/flex_gripper.png'
import styles from './styles.css'

interface AdditionalItemsRowProps {
  handleAttachment: () => void
  isEquipmentAdded: boolean
  name: 'gripper' | 'wasteChute'
}

export function AdditionalItemsRow(
  props: AdditionalItemsRowProps
): JSX.Element {
  const { handleAttachment, isEquipmentAdded, name } = props

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing8}
      height="6rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <h4 className={styles.row_title}>
          {name === 'gripper'
            ? i18n.t('modules.additional_equipment_display_names.gripper')
            : i18n.t('modules.additional_equipment_display_names.wasteChute')}
        </h4>
        <AdditionalItemImage
          //  TODO(jr, 9/13/23): update this image to the waste chute asset
          src={gripperImage}
          alt={name === 'gripper' ? 'Flex Gripper' : 'Waste Chute'}
        />
      </Flex>
      <div
        className={styles.module_col}
        style={{ marginLeft: SPACING.spacing32 }}
      >
        {isEquipmentAdded && name === 'gripper' ? (
          <LabeledValue
            label="Model"
            value={i18n.t(`modules.model_display_name.gripperV1`)}
          />
        ) : null}
      </div>

      {isEquipmentAdded && name === 'wasteChute' ? (
        <>
          <div className={styles.module_col}>
            <LabeledValue label="Position" value={`Slot ${WASTE_CHUTE_SLOT}`} />
          </div>
          <div className={styles.slot_map}>
            <SlotMap
              occupiedSlots={['D3']}
              collisionSlots={[]}
              robotType={FLEX_ROBOT_TYPE}
            />
          </div>
        </>
      ) : null}

      <div
        className={styles.modules_button_group}
        style={{ alignSelf: ALIGN_CENTER }}
      >
        <OutlineButton
          className={styles.module_button}
          onClick={handleAttachment}
        >
          {isEquipmentAdded ? i18n.t('shared.remove') : i18n.t('shared.add')}
        </OutlineButton>
      </div>
    </Flex>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
