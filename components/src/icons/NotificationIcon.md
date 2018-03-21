Basic orange notification dot:

```js
// import {FLASK, CIRCLE} from @opentrons/components
const {FLASK, CIRCLE} = require('./icon-data')

;<div>
  <div style={{width: '3rem'}}>
    <NotificationIcon
      name={FLASK}
      className={'dark_gray'}
      childName={CIRCLE}
      childClassName={'orange'}
    />
  </div>
</div>
```
