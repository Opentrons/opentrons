// @flow
import type {Page} from '../../navigation'

// Initial page to go to after loading protocol file
const page = (): Page => 'file-detail'

const allReducers = {
  page
}

export default allReducers
