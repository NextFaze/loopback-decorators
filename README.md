# loopback-decorators

Add remote method decorators to loopback.

# Installation

## Requirements

- [Node.js](https://nodejs.org/en/download/) >= 6.9.1

Within your node project, install the package from npm using:

```shell
npm install loopback-decorators
```

# Example Remote Method

A basic controller:

```ts
import {RemoteMethod} from 'loopback-decorators';

@RemoteMethod({
  selector: 'getStuff',
  providers: [
    '$app', '$instance', {
      provide: 'customEntity',
      useFactory: function(modelName) {
        return modelName.customEntityÏ
      },
      deps: ['modelName']
    }
  ],
  meta: {
    accessType: 'EXECUTE',
    isStatic: false,
    description: 'Get some stuff from a models remote method',
    accepts: [{
      arg: 'accessToken',
      type: 'any',
      http: function(ctx) {
        return ctx.req.accessToken;
      }
    }],
    returns: {arg: 'res', type: 'stuff', root: true},
    http: {path: '/get-stuff', verb: 'get'}
  }
})
export class GetStuffRemote {
  constructor(public app, public instance, public customEntity) {}
  async onRemote($accessToken) {
    // This is where you put the remote method logic
  }
}

```

# Example ModelEvent

A basic controller:

```ts
import {ModelEvent} from 'loopback-decorators';

@ModelEvent({
  <!-- the loopback event -->
  selector: 'create',
  providers: [
    '$app', '$model', '^User'
    }
  ],
})
export class DoSomethingOnCreate {
  constructor(public app, public Model, public User) {}
  async onEvent(inst) {
    // This is where you put the event method logic
  }
}

```
# License

MIT