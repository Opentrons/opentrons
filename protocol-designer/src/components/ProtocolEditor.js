// @flow
import * as React from 'react'

import {Icon, TitledList, VerticalNavBar} from '@opentrons/components'
import StepItem from './StepItem'
import StepSubItem from './StepSubItem'

import styles from './StepItem.css' // TODO: Ian 2018-01-11 This is just for "Labware & Ingredient Setup" right now, can remove later

export default function ProtocolEditor () {
  return (
    <div>
      <div style={{height: '100%', float: 'left'}}> {/* TODO: Ian 2018-01-11 do real styles or use structure in complib... this is quick HACK */}
        <VerticalNavBar>
          <Icon name='file' />
          <Icon name='cog' />
        </VerticalNavBar>
      </div>
      <div className={styles.fake_sidepanel_standin}>
        {/* TODO: Ian 2018-01-11 ^^^^ this div will be <SidePanel> once that is factored out of App */}
        <h3>Protocol Step List</h3> {/* TODO: Ian 2018-01-11 <-- this h3 will be SidePanel title. */}
        <TitledList className={styles.step_item} iconName='flask' title='Labware & Ingredient Setup' />

        <StepItem title='Transfer 1' stepType='transfer' sourceLabwareName='DNA Plate' destLabwareName='Output Plate' description='This is a transfer. Lorem ipsum delorom sic blah blah blaaaah.'>
          <StepSubItem
            sourceIngredientName='DNA'
            sourceWell='B1'
            destIngredientName='ddH2O'
            destWell='B2'
          />
          <StepSubItem
            sourceIngredientName='DNA'
            sourceWell='C1'
            destIngredientName='ddH2O'
            destWell='C2'
          />
          <StepSubItem
            sourceIngredientName='DNA'
            sourceWell='D1'
            destIngredientName='ddH2O'
            destWell='D2'
          />
        </StepItem>

        <StepItem title='Pause 1' stepType='pause' />

        <StepItem title='Distribute 1' stepType='distribute' sourceLabwareName='LB Plate' destLabwareName='Output Tubes' selected>
          <StepSubItem
            sourceIngredientName='LB'
            sourceWell='A1'
            destIngredientName='ddH2O'
            destWell='B1'
          />
          <StepSubItem
            sourceIngredientName='LB'
            destIngredientName='ddH2O'
            destWell='B2'
          />
          <StepSubItem
            sourceIngredientName='LB'
            destIngredientName='ddH2O'
            destWell='B3'
          />
          <StepSubItem
            sourceIngredientName='LB'
            sourceWell='A1'
            destIngredientName='ddH2O'
            destWell='B4'
          />
        </StepItem>

        <StepItem title='Pause 2' stepType='pause' description='Wait until operator adds new tip rack.' />

        <StepItem title='Consolidate 1' stepType='consolidate' sourceLabwareName='Labware 1' destLabwareName='Labware 2'>
          <StepSubItem
            sourceIngredientName='Cells'
            sourceWell='A1'
          />
          <StepSubItem
            sourceIngredientName='Cells'
            sourceWell='A2'
          />
          <StepSubItem
            sourceIngredientName='Cells'
            sourceWell='A3'
            destIngredientName='LB Broth'
            destWell='H1'
          />
        </StepItem>

      </div>
    </div>
  )
}
