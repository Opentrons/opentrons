import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_AUTO,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  POSITION_STICKY,
  SPACING,
} from '@opentrons/components'

import { getIsOnDevice } from '../../redux/config'

import type { IconName } from '@opentrons/components'
import { ModalContentOneColSimpleButtons } from './ModalContentOneColSimpleButtons'
import { TwoColumn } from './TwoColumn'
export { ModalContentOneColSimpleButtons, TwoColumn }

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

const MODAL_BASE_STYLE = {
  backgroundColor: COLORS.white,
  position: POSITION_RELATIVE,
  overflowY: OVERFLOW_AUTO,
  borderRadius: BORDERS.borderRadius8,
  boxShadow: BORDERS.smallDropShadow,
  'data-testid': '__otInterventionModal',
} as const

const MODAL_DESKTOP_STYLE = {
  ...MODAL_BASE_STYLE,
  maxHeight: '100%',
  width: '47rem',
} as const

const MODAL_ODD_STYLE = {
  ...MODAL_BASE_STYLE,
  width: '62rem',
  height: '35.5rem',
} as const

const HEADER_STYLE = {
  alignItems: ALIGN_CENTER,
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
  /** Optional modal title heading. Aligned to the left. */
  titleHeading?: React.ReactNode
  /** Optional modal heading right of the icon. Aligned right if titleHeading is supplied, otherwise aligned left. **/
  iconHeading?: React.ReactNode
  /** Optional onClick for the icon heading and icon. */
  iconHeadingOnClick?: () => void
  /** overall style hint */
  type?: ModalType
  /** optional icon name */
  iconName?: IconName | null | undefined
  /** modal contents */
  children: React.ReactNode
}

export function InterventionModal({
  type,
  titleHeading,
  iconHeadingOnClick,
  iconName,
  iconHeading,
  children,
}: InterventionModalProps): JSX.Element {
  const modalType = type ?? 'intervention-required'
  const headerColor =
    modalType === 'error' ? ERROR_COLOR : INTERVENTION_REQUIRED_COLOR
  const border = `${BORDER_STYLE_BASE} ${
    modalType === 'error' ? ERROR_COLOR : INTERVENTION_REQUIRED_COLOR
  }`
  const headerJustifyContent =
    titleHeading != null ? JUSTIFY_SPACE_BETWEEN : undefined

  const isOnDevice = useSelector(getIsOnDevice)
  const modalStyle = isOnDevice ? MODAL_ODD_STYLE : MODAL_DESKTOP_STYLE

  return (
    <Flex {...WRAPPER_STYLE}>
      <Flex {...BASE_STYLE} zIndex={10}>
        <Box
          {...modalStyle}
          border={border}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
          }}
        >
          <Flex
            {...HEADER_STYLE}
            backgroundColor={headerColor}
            justifyContent={headerJustifyContent}
            onClick={iconHeadingOnClick}
          >
            {titleHeading}
            <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing12}>
              {iconName != null ? (
                <Icon name={iconName} size={SPACING.spacing32} />
              ) : null}
              {iconHeading != null ? iconHeading : null}
            </Flex>
          </Flex>
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
