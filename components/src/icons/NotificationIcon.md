The notification icon wrapper div is already positioned relative by default.

The notification child icon is already positioned absolute by default.

```js
// import {FLASK, CIRCLE} from @opentrons/components
const {FLASK, CIRCLE} = require('./icon-data')

;<div>
  <div style={{width: '3rem'}}>
    <NotificationIcon
      parentName={FLASK}
      className={'notification-icon-parent'}
      childName={CIRCLE}
      childClassName={'notification-icon-child'}
    />
  </div>
</div>
```
