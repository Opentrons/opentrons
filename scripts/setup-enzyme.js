import Adapter from '@wojtekmaj/enzyme-adapter-react-17'
import { configure } from 'enzyme'
import 'jest-styled-components'

configure({ adapter: new Adapter() })
