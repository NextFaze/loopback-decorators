# loopback-decorators

Add remote method decorators to loopback.

# Installation

## Requirements

* [Node.js](https://nodejs.org/en/download/) >= 6.9.1

Within your node project, install the package from npm using:

```shell
npm install loopback-decorators
```

# Special Providers

Loopback Decorators provides some built-in special providers for loopback

| Key               | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| $app              | The loopback application                                           |
| $model            | The model that the request is tied to                              |
| $instance         | The actual model instance in instance methods                      |
| ^SomeModelName    | Any model from the app e.g. '^User'                                |
| @req              | The incoming request                                               |
| @res              | The express response                                               |
| @ctx              | The remoting context                                               |
| @headers          | The request headers                                                |
| @accessToken      | The requesting access token                                        |
| @any.context.path | Arbitrary path on the context object (e.g. '@req.headers.accepts') |

* Provider Tokens

If you don't like strings, loopback decorators also exports several 'injection tokens' for these providers:

| Token           | Provider Key   |
| --------------- | -------------- |
| Application     | '$app'         |
| ModelInstance   | '$instance'    |
| RemotingContext | '@ctx'         |
| Request         | '@req'         |
| Response        | '@res'         |
| AccessToken     | '@accessToken' |
| Headers         | '@headers'     |

# Example Remote Method

A basic controller:

```ts
import { RemoteMethod } from 'loopback-decorators';

@RemoteMethod({
  selector: 'getStuff',
  providers: [
    '$app',
    '$instance',
    {
      provide: 'customEntity',
      useFactory: function(modelName) {
        return modelName.customEntityÏ;
      },
      deps: ['modelName'],
    },
  ],
  meta: {
    accessType: 'EXECUTE',
    isStatic: false,
    description: 'Get some stuff from a models remote method',
    accepts: [
      {
        arg: 'accessToken',
        type: 'any',
        http: function(ctx) {
          return ctx.req.accessToken;
        },
      },
    ],
    returns: { arg: 'res', type: 'stuff', root: true },
    http: { path: '/get-stuff', verb: 'get' },
  },
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

# Setting up your remote module

```ts
import { RemoteMethodModule } from 'loopback-decorators';

@RemoteMethodModule({
  remotes: [GetStuffRemote],
  events: [DoSomethingOnCreate],
  proxyFor: 'ModelInternal',
  proxyMethods: ['find', 'findById'],
})
export class ModelAPI {
  constructor(public Model: any) {}
}

export = function(Model: any) {
  return new ModelAPI(Model);
};
```

# Validating Remote Inputs

```ts
@RemoteMethod({
  // ...
  meta: {
    accessType: 'WRITE',
    isStatic: false,
    description: 'Create a thing',
    accepts: [
      {
        arg: 'payload',
        type: 'RequestModelType',
        http: { source: 'body' },
      },
    ],
    returns: { arg: 'res', type: 'stuff', root: true },
    http: { path: '/things', verb: 'post' },
  },
})
export class GetStuffRemote {
  constructor(public app, public instance, public customEntity) {}
  async onRemote(@Validate payload) {
    // Error will be thrown before `onRemote` is called if the payload is not valid
  }
}
```

# Returning an instance of another model as a response

```ts
export class GetStuffRemote {
  constructor(public app, public instance, public customEntity) {}

  @Response('ModelContructorName')
  async onRemote(payload: any) {
    // Result returned will be an instance of app.models.ModelContructorName
  }
}
```

or, if you are returning an array

```ts
export class GetStuffRemote {
  constructor(public app, public instance, public customEntity) {}

  @Response(['ModelContructorName'])
  async onRemote(payload: any) {
    // Result returned will be an array of app.models.ModelContructorName
  }
}
```

You can also pass the config directly:

```ts
  @Response({ responseClass: 'MyResponseClass' })
  // Or, for an array
  @Response({ responseClass: 'MyResponseClass', isMulti: true })
```

# License

MIT
