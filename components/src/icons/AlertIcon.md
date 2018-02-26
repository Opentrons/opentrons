The alert icon wrapper div is already positioned relative by default.

The alert child icon is already positioned absolute by default.

```js
// import {FLASK, CIRCLE} from @opentrons/components
const {FLASK, CIRCLE} = require('./icon-data')

;<div>
  <div style={{width: '3rem'}}>
    <AlertIcon
      baseName={FLASK}
      className={'alert-icon-parent'}
      alertName={CIRCLE}
      alertClassName={'alert-icon-child'}
    />
  </div>
</div>
```
