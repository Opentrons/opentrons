import * as React from 'react'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  Link,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  SecondaryButton,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Icon,
  ALIGN_FLEX_END,
  useOnClickOutside,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ERROR_TOAST, SUCCESS_TOAST } from '../../atoms/Toast'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import {
  useTrackEvent,
  ANALYTICS_OPEN_LABWARE_CREATOR_FROM_BOTTOM_OF_LABWARE_LIBRARY_LIST,
} from '../../redux/analytics'
import { DropdownMenu } from '../../atoms/MenuList/DropdownMenu'
import { LabwareCard } from '../../organisms/LabwareCard'
import { AddCustomLabwareSlideout } from '../../organisms/AddCustomLabwareSlideout'
import { LabwareDetails } from '../../organisms/LabwareDetails'
import { useToaster } from '../../organisms/ToasterOven'
import {
  LabwareDefAndDate,
  useAllLabware,
  useLabwareFailure,
  useNewLabwareName,
} from './hooks'

import type { DropdownOption } from '../../atoms/MenuList/DropdownMenu'
import type { LabwareFilter, LabwareSort } from './types'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create/'
const labwareDisplayCategoryFilters: LabwareFilter[] = [
  'all',
  'adapter',
  'aluminumBlock',
  'customLabware',
  'reservoir',
  'tipRack',
  'tubeRack',
  'wellPlate',
]

const FILTER_OPTIONS: DropdownOption[] = labwareDisplayCategoryFilters.map(
  category => ({
    name: startCase(category),
    value: category,
  })
)

const SORT_BY_BUTTON_STYLE = css`
  background-color: ${COLORS.transparent};
  cursor: pointer;
  &:hover {
    background-color: ${COLORS.medGreyHover};
  }

  &:active,
  &:focus {
    background-color: ${COLORS.medGreyEnabled};
  }
`

export function Labware(): JSX.Element {
  const { t } = useTranslation(['labware_landing', 'shared'])

  const [sortBy, setSortBy] = React.useState<LabwareSort>('alphabetical')
  const [showSortByMenu, setShowSortByMenu] = React.useState<boolean>(false)
  const toggleSetShowSortByMenu = (): void => setShowSortByMenu(!showSortByMenu)
  const trackEvent = useTrackEvent()
  const [filterBy, setFilterBy] = React.useState<LabwareFilter>('all')
  const { makeToast } = useToaster()

  const labware = useAllLabware(sortBy, filterBy)
  const { labwareFailureMessage, clearLabwareFailure } = useLabwareFailure()
  const { newLabwareName, clearLabwareName } = useNewLabwareName()
  const [showAddLabwareSlideout, setShowAddLabwareSlideout] = React.useState(
    false
  )
  const [
    currentLabwareDef,
    setCurrentLabwareDef,
  ] = React.useState<null | LabwareDefAndDate>(null)

  const sortOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowSortByMenu(false),
  })
  React.useEffect(() => {
    if (labwareFailureMessage != null) {
      setShowAddLabwareSlideout(false)
      makeToast(labwareFailureMessage, ERROR_TOAST, {
        closeButton: true,
        onClose: clearLabwareFailure,
      })
    } else if (newLabwareName != null) {
      setShowAddLabwareSlideout(false)
      makeToast(t('imported', { filename: newLabwareName }), SUCCESS_TOAST, {
        closeButton: true,
        onClose: clearLabwareName,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labwareFailureMessage, newLabwareName])

  return (
    <>
      <Box paddingX={SPACING.spacing16} paddingY={SPACING.spacing16}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          paddingBottom={SPACING.spacing24}
        >
          <StyledText
            as="h1"
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('labware')}
          </StyledText>
          <SecondaryButton onClick={() => setShowAddLabwareSlideout(true)}>
            {t('import')}
          </SecondaryButton>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_FLEX_END}
          paddingBottom={SPACING.spacing24}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('category')}
            </StyledText>
            <DropdownMenu
              filterOptions={FILTER_OPTIONS}
              currentOption={{ value: filterBy, name: startCase(filterBy) }}
              onClick={value => {
                setFilterBy(value as LabwareFilter)
              }}
            />
          </Flex>
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              color={COLORS.darkGreyEnabled}
            >
              {t('shared:sort_by')}
            </StyledText>
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              borderRadius={BORDERS.radiusSoftCorners}
              marginLeft={SPACING.spacing8}
              css={SORT_BY_BUTTON_STYLE}
              onClick={toggleSetShowSortByMenu}
            >
              <StyledText
                css={TYPOGRAPHY.pSemiBold}
                paddingLeft={SPACING.spacing8}
                paddingRight={SPACING.spacing4}
                paddingY={SPACING.spacing4}
                data-testid="sortBy-label"
              >
                {sortBy === 'alphabetical'
                  ? t('shared:alphabetical')
                  : t('shared:reverse')}
              </StyledText>
              <Icon
                paddingRight={SPACING.spacing8}
                height={TYPOGRAPHY.lineHeight16}
                name={showSortByMenu ? 'chevron-up' : 'chevron-down'}
              />
            </Flex>
          </Flex>
          {showSortByMenu && (
            <Flex
              width="9.375rem"
              zIndex={2}
              borderRadius={BORDERS.radiusSoftCorners}
              boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
              position={POSITION_ABSOLUTE}
              backgroundColor={COLORS.white}
              top="8.5rem"
              right={SPACING.spacing2}
              flexDirection={DIRECTION_COLUMN}
              ref={sortOverflowWrapperRef}
            >
              <MenuItem
                onClick={() => {
                  setSortBy('alphabetical')
                  setShowSortByMenu(false)
                }}
              >
                {t('shared:alphabetical')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('reverse')
                  setShowSortByMenu(false)
                }}
              >
                {t('shared:reverse')}
              </MenuItem>
            </Flex>
          )}
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {labware.map((labware, index) => (
            <LabwareCard
              key={`${String(labware.definition.metadata.displayName)}${index}`}
              labware={labware}
              onClick={() => {
                setCurrentLabwareDef(labware)
              }}
            />
          ))}
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
          marginTop={SPACING.spacing32}
        >
          <StyledText
            as="p"
            color={COLORS.black}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('create_new_def')}
          </StyledText>

          <Link
            external
            onClick={() =>
              trackEvent({
                name: ANALYTICS_OPEN_LABWARE_CREATOR_FROM_BOTTOM_OF_LABWARE_LIBRARY_LIST,
                properties: {},
              })
            }
            href={LABWARE_CREATOR_HREF}
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
          >
            {t('open_labware_creator')}
            <Icon
              name="open-in-new"
              size="0.5rem"
              marginLeft={SPACING.spacing4}
            />
          </Link>
        </Flex>
      </Box>
      {showAddLabwareSlideout && (
        <AddCustomLabwareSlideout
          isExpanded={showAddLabwareSlideout}
          onCloseClick={() => setShowAddLabwareSlideout(false)}
        />
      )}
      {currentLabwareDef != null && (
        <LabwareDetails
          labware={currentLabwareDef}
          onClose={() => setCurrentLabwareDef(null)}
        />
      )}
    </>
  )
}
