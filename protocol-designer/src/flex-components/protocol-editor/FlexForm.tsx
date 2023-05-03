import * as React from 'react'
import { SecondaryButton } from '@opentrons/components'
import { Link } from 'react-router-dom'
import { i18n } from '../../localization'
import { FlexProtocolEditorComponent } from './FlexProtocolEditor'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { useDispatch } from 'react-redux'
import {
  actions as fileActions,
  selectors as loadFileSelectors,
} from '../../load-file'
import { PipetteOnDeck, actions as stepFormActions } from '../../step-forms'
import { actions as steplistActions } from '../../steplist'
import { uuid } from '../../utils'
import { mapValues, omit } from 'lodash'
import { NormalizedPipette } from '@opentrons/step-generation'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'

function FlexFormComponent(): JSX.Element {
  const dispatch = useDispatch()
  const onSave = (fields: any): any => {
    const { newProtocolFields, pipettes } = fields
    dispatch(fileActions.createNewProtocol(newProtocolFields))

    const pipettesById: Record<string, PipetteOnDeck> = pipettes.reduce(
      (acc: any, pipette: string) => ({ ...acc, [uuid()]: pipette }),
      {}
    )

    // create new pipette entities
    dispatch(
      stepFormActions.createPipettes(
        mapValues(
          pipettesById,
          (p: PipetteOnDeck, id: string): NormalizedPipette => ({
            // @ts-expect-error(sa, 2021-6-22): id will always get overwritten
            id,
            ...omit(p, 'mount'),
          })
        )
      )
    )

    // update pipette locations in initial deck setup step
    dispatch(
      steplistActions.changeSavedStepForm({
        stepId: INITIAL_DECK_SETUP_STEP_ID,
        update: {
          pipetteLocationUpdate: mapValues(
            pipettesById,
            (p: typeof pipettesById[keyof typeof pipettesById]) => p.mount
          ),
        },
      })
    )
  }

  return (
    <div className={styles.flex_header}>
      <div className={styles.flex_title}>
        <StyledText as="h1">{i18n.t('flex.header.title')}</StyledText>
        <Link to={'/'}>
          <SecondaryButton className={styles.cancel_button} tabIndex={0}>
            <StyledText as="h3">
              {i18n.t('flex.header.cancel_button')}
            </StyledText>
          </SecondaryButton>
        </Link>
      </div>
      <StyledText as="h5" className={styles.required_fields}>
        {i18n.t('flex.header.required_fields')}
      </StyledText>
      <FlexProtocolEditorComponent onSave={onSave} />
    </div>
  )
}

export const FlexForm = FlexFormComponent
