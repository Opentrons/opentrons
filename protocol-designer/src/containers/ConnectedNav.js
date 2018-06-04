// @flow
import * as React from 'react'
import type {ThunkDispatch, BaseState} from '../types'
import {connect} from 'react-redux'

import {NavButton, VerticalNavBar} from '@opentrons/components'
import {type Page, actions, selectors} from '../navigation'
import styles from './NavBar.css'

type Props = {
  currentPage: Page,
  handleClick: Page => (e: ?SyntheticEvent<>) => void
}

function Nav (props: Props) {
  return (
    <VerticalNavBar className={styles.nav_bar}>
      <NavButton
        iconName='ot-file'
        title='FILE'
        selected={props.currentPage === 'file-splash' || props.currentPage === 'file-detail'}
        onClick={props.handleClick('file-detail')} />

      <NavButton
        iconName='ot-design'
        title='DESIGN'
        disabled={props.currentPage === 'file-splash'}
        selected={props.currentPage === 'steplist' || props.currentPage === 'ingredient-detail'}
        onClick={props.handleClick('steplist')} />
    </VerticalNavBar>
  )
}

function mapStateToProps (state: BaseState) {
  return {
    currentPage: selectors.currentPage(state)
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    handleClick: (pageName: Page) => () => dispatch(actions.navigateToPage(pageName))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
