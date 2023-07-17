import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import gripperImage from '../../images/flex_gripper.svg'
import styles from './styles.css'

interface GripperRowProps {
  handleGripper: () => void
  isGripperAdded: boolean
}

export function GripperRow(props: GripperRowProps): JSX.Element {
  const { handleGripper, isGripperAdded } = props
  const { i18n, t } = useTranslation()

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <h4 className={styles.row_title}>Flex Gripper</h4>
        <AdditionalItemImage src={gripperImage} alt="Opentrons Flex Gripper" />
      </Flex>
      <div
        className={styles.modules_button_group}
        style={{ alignSelf: ALIGN_CENTER }}
      >
        <OutlineButton className={styles.module_button} onClick={handleGripper}>
          {isGripperAdded
            ? i18n.format(t('shared.remove'), 'capitalize')
            : i18n.format(t('shared.add'), 'capitalize')}
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
