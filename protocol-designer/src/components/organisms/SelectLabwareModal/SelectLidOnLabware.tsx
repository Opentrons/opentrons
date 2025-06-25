import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  CustomizeExpandButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
} from '@opentrons/components'

import { getEnableStacking } from '../../../feature-flags/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectLid } from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'

import type { ThunkDispatch } from '../../../types'

interface SelectLidOnLabwareProps {
  lidLoadNames: string[]
  parentLabwareURI: string
  isAdapter: boolean
  category: string
  loadName: string
  lidURIs: string[]
}
export function SelectLidOnLabware(
  props: SelectLidOnLabwareProps
): JSX.Element | null {
  const {
    lidLoadNames,
    parentLabwareURI,
    isAdapter,
    category,
    loadName,
    lidURIs,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const enableStacking = useSelector(getEnableStacking)
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const defs = getOnlyLatestDefs()
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedTopLabware, selectedLidLabware } = zoomedInSlotInfo
  return !isAdapter &&
    parentLabwareURI === selectedTopLabware.labwareDefURI &&
    lidURIs.length > 1 ? (
    <ListButtonAccordionContainer id={`accordionContainer_${loadName}`}>
      <ListButtonAccordion
        key={`${category}_${loadName}_accordion`}
        isNested
        mainHeadline={t('lid_compatible_labware')}
        isExpanded={parentLabwareURI === selectedTopLabware.labwareDefURI}
      >
        {lidURIs.map(defUri => {
          const def = defs[defUri] ?? customLabwareDefs[defUri]

          return (
            <CustomizeExpandButton
              enableStackingFF={enableStacking}
              loadName={def.parameters.loadName}
              allowInputField={lidLoadNames.includes(def.parameters.loadName)}
              key={`${category}_${loadName}_${defUri}`}
              id={`${category}_${loadName}_${defUri}`}
              buttonText={def?.metadata.displayName ?? ''}
              buttonValue={defUri}
              onChange={e => {
                e.stopPropagation()
                dispatch(
                  selectLid({
                    labwareDefURI: defUri,
                  })
                )
              }}
              isSelected={defUri === selectedLidLabware}
            />
          )
        })}
      </ListButtonAccordion>
    </ListButtonAccordionContainer>
  ) : null
}
