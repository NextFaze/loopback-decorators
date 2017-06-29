import 'reflect-metadata';

import {makeDecorator} from './decorators';

export function RemoteMethodModule(options: any) {
  return function RemoteMethodModule(ctor: Function) {
    // save a reference to the original constructor
    const Original: any = ctor;

    // the new constructor behaviour
    let f: any = function(...args: any[]) {
      let Model = args[0];
      options.remotes.forEach((RemoteMethod: any) => {
        let meta = Reflect.getMetadata('annotations', RemoteMethod);
        meta.forEach(createRemoteMethod.bind({}, Model, RemoteMethod));
      });
      return new Original(...args);
    };
    f.prototype = Original.prototype;
    return f;
  };
};
export const RemoteMethod: any = <any>makeDecorator(
    'RemoteMethod',
    {selector: undefined, meta: undefined, providers: undefined});
export function _normalizeRelations(providers: any[] = [], res: any = []) {
  providers.forEach(b => {
    if (typeof b === 'string') {
      res.push({provide: b, useToken: b});

    } else if (b && typeof b === 'object' && (b as any).provide !== undefined) {
      res.push(b);

    } else if (b instanceof Array) {
      _normalizeRelations(b, res);

    } else {
      throw 'invalid provider error';
    }
  });
  return res;
}
export function resolve(instance: any, providers: any[]) {
  let normalized = _normalizeRelations(providers, []);
  let resolving = normalized.map((provider: any) => {
    if (typeof provider.useToken === 'string')
      return $resolve.call(instance, provider.useToken);
    else if (typeof provider.useFactory === 'function')
      return $resolve.call(instance, provider.deps)
          .then(
              (resolved: any) => provider.useFactory.apply(instance, resolved));
  });
  return Promise.all(resolving);
}
export function getAsync(relation: string) {
  return this[relation].getAsync();
}
export function createRemoteMethod(
    RemoteClass: any, RemoteMethod: any, props: any) {
  let {selector, meta, providers} = props;
  if (meta.isStatic) {
    RemoteClass[selector] = async function(...args: any[]) {
      let instance = this;
      try {
        let proms = await resolve(instance, providers);
        let isNull = proms.indexOf(null);
        if (isNull > -1) {
          throw Error(
              `cannot instantiate ${
                                    RemoteMethod.name
                                  } provider at position: ${isNull} is null`);
        }
        return new RemoteMethod(...proms).onRemote(...args);
      } catch (err) {
        throw 'error instantiating method';
      }
    };
  } else {
    RemoteClass.prototype[selector] = async function(...args: any[]) {
      let instance = this;
      try {
        let proms = await resolve(instance, providers);
        let isNull = proms.indexOf(null);
        if (isNull > -1) {
          throw Error(
              `cannot instantiate ${
                                    RemoteMethod.name
                                  } provider at position: ${isNull} is null`);
        }
        return new RemoteMethod(...proms).onRemote(...args);
      } catch (err) {
        throw err;
      }
    };
  }
  RemoteClass.remoteMethod(selector, meta);
}
export function $resolve(dep: any) {
  if (Array.isArray(dep))
    return Promise.all(dep.map((d) => $resolve.call(this, d)));
  switch (dep) {
    case '$model': {
      if (typeof this === 'object') {
        return this.constructor;
      } else if (typeof this === 'function') {
        return this;
      } else {
        throw 'model is not object or function';
      }
    }
    case '$instance': {
      if (typeof this === 'object') {
        return this;
      } else {
        throw 'instance not available in this ctx';
      }
    }
    case '$app': {
      return new Promise((resolve, reject) => {
        if (typeof this === 'object') {
          this.constructor.getApp((err: any, app: any) => {
            if (err) return reject(err);
            return resolve(app);
          });
        } else if (typeof this === 'function') {
          this.getApp((err: any, app: any) => {
            if (err) return reject(err);
            return resolve(app);
          });
        }
      });
    }
  }
  if (dep[0] === '^') {
    return new Promise((resolve, reject) => {
      if (typeof this === 'object') {
        this.constructor.getApp((err: any, app: any) => {
          if (err) return reject(err);
          return resolve(app.models[dep.slice(1)]);
        });
      } else if (typeof this === 'function') {
        this.getApp((err: any, app: any) => {
          if (err) return reject(err);
          return resolve(app.models[dep.slice(1)]);
        });
      }
    });
  }
  return getAsync.call(this, dep);
}
