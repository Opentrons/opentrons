// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { Link } from 'react-router-dom'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import {
  LabeledValue,
  OutlineButton,
  InstrumentDiagram,
  Box,
  Flex,
  Text,
  SecondaryBtn,
  DIRECTION_COLUMN,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SIZE_2,
  SIZE_4,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  ALIGN_CENTER,
  BORDER_SOLID_LIGHT,
  Icon,
  COLOR_ERROR,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  JUSTIFY_START,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import * as Config from '../../config'
import styles from './styles.css'
import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  INTENT_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../CalibrationPanels'
import type { State } from '../../types'

import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../calibration'

import { InlineCalibrationWarning } from '../InlineCalibrationWarning'

import type { Mount, AttachedPipette } from '../../pipettes/types'
import { findLabwareDefWithCustom } from '../../findLabware'
import * as CustomLabware from '../../custom-labware'
import { Portal } from '../portal'
import { PipetteCalibrationInfo } from './PipetteCalibrationInfo'

export type PipetteInfoProps = {|
  robotName: string,
  mount: Mount,
  pipette: AttachedPipette | null,
  changeUrl: string,
  settingsUrl: string | null,
|}

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

const NOWN_CUSTOM_LABWARE = 'unknown custom tiprack'
const SERIAL_NUMBER = 'Serial number'
const PER_PIPETTE_BTN_STYLE = {
  width: '11rem',
  marginTop: SPACING_2,
  padding: SPACING_2,
}

export function PipetteInfo(props: PipetteInfoProps): React.Node {
  const { robotName, mount, pipette, changeUrl, settingsUrl } = props
  const label = LABEL_BY_MOUNT[mount]
  const displayName = pipette ? pipette.modelSpecs.displayName : null
  const serialNumber = pipette ? pipette.id : null
  const channels = pipette ? pipette.modelSpecs.channels : null
  const direction = pipette ? 'change' : 'attach'

  return (
    <Flex width="50%" flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex
          key={`pipetteInfo${mount}`}
          flex="1"
          flexDirection={DIRECTION_COLUMN}
        >
          <Flex
            alignItems={ALIGN_FLEX_START}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            css={css`
              max-width: 14rem;
            `}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              height="10rem"
            >
              <LabeledValue
                label={label}
                value={(displayName || 'None').replace(/-/, '‑')} // non breaking hyphen
              />
              <LabeledValue
                label={SERIAL_NUMBER}
                value={serialNumber || 'None'}
              />
            </Flex>
            <Box
              key={`pipetteImage${mount}`}
              height={SIZE_4}
              width="2.25rem"
              border={BORDER_SOLID_LIGHT}
              marginRight={mount === 'right' ? SPACING_3 : SPACING_1}
              marginLeft={mount === 'right' ? SPACING_1 : SPACING_3}
            >
              {channels && (
                <InstrumentDiagram
                  pipetteSpecs={pipette?.modelSpecs}
                  mount={mount}
                  className={styles.pipette_diagram}
                />
              )}
            </Box>
            <OutlineButton Component={Link} to={changeUrl}>
              {direction}
            </OutlineButton>
          </Flex>
          {settingsUrl !== null && (
            <SecondaryBtn {...PER_PIPETTE_BTN_STYLE} as={Link} to={settingsUrl}>
              settings
            </SecondaryBtn>
          )}
          {serialNumber && (
            <PipetteCalibrationInfo
              robotName={robotName}
              serialNumber={serialNumber}
              mount={mount}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
