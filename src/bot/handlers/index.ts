import start from './start.js'
import withURL from './with-url.js'

import Composer from '../composer.js'
const composer = new Composer()

composer.use(start).use(withURL)

export default composer
