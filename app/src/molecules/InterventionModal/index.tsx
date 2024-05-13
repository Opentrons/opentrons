import * as React from 'react'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  OVERFLOW_AUTO,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  POSITION_STICKY,
  SPACING,
} from '@opentrons/components'
import type { IconName } from '@opentrons/components'

export type ModalType = 'intervention-required' | 'error'

const BASE_STYLE = {
  position: POSITION_ABSOLUTE,
  alignItems: ALIGN_CENTER,
  justifyContent: JUSTIFY_CENTER,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
  'data-testid': '__otInterventionModalHeaderBase',
} as const

const BORDER_STYLE_BASE = `6px ${BORDERS.styleSolid}`

const MODAL_STYLE = {
  backgroundColor: COLORS.white,
  position: POSITION_RELATIVE,
  overflowY: OVERFLOW_AUTO,
  maxHeight: '100%',
  width: '47rem',
  borderRadius: BORDERS.borderRadius8,
  boxShadow: BORDERS.smallDropShadow,
  'data-testid': '__otInterventionModal',
} as const

const HEADER_STYLE = {
  alignItems: ALIGN_CENTER,
  gridGap: SPACING.spacing12,
  padding: `${SPACING.spacing20} ${SPACING.spacing32}`,
  color: COLORS.white,
  position: POSITION_STICKY,
  top: 0,
  'data-testid': '__otInterventionModalHeader',
} as const

const WRAPPER_STYLE = {
  position: POSITION_ABSOLUTE,
  left: '0',
  right: '0',
  top: '0',
  bottom: '0',
  zIndex: '1',
  backgroundColor: `${COLORS.black90}${COLORS.opacity40HexCode}`,
  cursor: 'default',
  'data-testid': '__otInterventionModalWrapper',
} as const

const INTERVENTION_REQUIRED_COLOR = COLORS.blue50
const ERROR_COLOR = COLORS.red50

export interface InterventionModalProps {
  /** optional modal heading **/
  heading?: React.ReactNode
  /** overall style hint */
  type?: ModalType
  /** optional icon name */
  iconName?: IconName | null | undefined
  /** modal contents */
  children: React.ReactNode
}

export function InterventionModal(props: InterventionModalProps): JSX.Element {
  const modalType = props.type ?? 'intervention-required'
  const headerColor =
    modalType === 'error' ? ERROR_COLOR : INTERVENTION_REQUIRED_COLOR
  const border = `${BORDER_STYLE_BASE} ${
    modalType === 'error' ? ERROR_COLOR : INTERVENTION_REQUIRED_COLOR
  }`
  return (
    <Flex {...WRAPPER_STYLE}>
      <Flex {...BASE_STYLE} zIndex={10}>
        <Box
          {...MODAL_STYLE}
          border={border}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
          }}
        >
          <Flex {...HEADER_STYLE} backgroundColor={headerColor}>
            {props.iconName != null ? (
              <Icon name={props.iconName} size={SPACING.spacing32} />
            ) : null}
            {props.heading != null ? props.heading : null}
          </Flex>
          {props.children}
        </Box>
      </Flex>
    </Flex>
  )
}
