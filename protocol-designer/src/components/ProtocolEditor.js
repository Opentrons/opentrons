// @flow
import * as React from 'react'
import {Icon, TitleBar, VerticalNavBar} from '@opentrons/components'
import styles from './ProtocolEditor.css'
import StepEditForm from '../components/StepEditForm' // TODO: make container
import ConnectedStepList from '../containers/ConnectedStepList'

export default function ProtocolEditor () {
  return (
    <div className={styles.wrapper}>
      <VerticalNavBar className={styles.nav_bar}>
        <Icon name='file' />
        <Icon name='cog' />
      </VerticalNavBar>
      <ConnectedStepList />
      <div className={styles.main_page_wrapper}>
        {/* TODO Ian 2018-01-24 Connect TitleBar, figure out when it changes */}
        <TitleBar title='Title' subtitle='Subtitle' />

        <div className={styles.main_page_content}>
          <StepEditForm
            onCancel={e => window.alert('TODO: Cancel')}
            onSave={e => window.alert('TODO: Save')}
            handleChange={(accessor: string) => (e: React.SyntheticEvent<>) => console.log(accessor, e.target.type === 'checkbox' ? e.target.checked : e.target.value)}
            formData={{
              'aspirate--labware': 'destPlateId',
              'aspirate--wells': 'A1,A2,A3',
              'aspirate--pre-wet-tip': false,
              'aspirate--touch-tip': true,
              'aspirate--change-tip': 'once'
            }}
            stepType='transfer'
            /* ingredientOptions={[
              {name: 'Ingredient 1', value: 'ingredId1'},
              {name: 'Ingredient 2', value: 'ingredId2'}
            ]} */
            pipetteOptions={[
              {name: '10 μL Single', value: '10-single'}, /* TODO: should be 'p10 single'? What 'value'? */
              {name: '300 μL Single', value: '300-single'},
              {name: '10 μL Multi-Channel', value: '10-multi'},
              {name: '300 μL Multi-Channel', value: '300-multi'}
            ]}
            labwareOptions={[
              {name: 'Source Plate', value: 'sourcePlateId'}, /* TODO later: dropdown needs to deal with being empty */
              {name: 'Dest Plate', value: 'destPlateId'},
              {name: 'Trough with very long name', value: 'troughId'}
            ]}
          />
          {'Deck map goes here! '.repeat(200)}
        </div>
      </div>
    </div>
  )
}
