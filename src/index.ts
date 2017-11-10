import 'reflect-metadata';

import { createEventMethod } from './lib/create-event';
import { createRemoteMethod } from './lib/create-remote';
import { makeDecorator } from './lib/type-decorators';

export { Response } from './lib/response';
export { Validate } from './lib/validate';

/**
 * Configuration fo rthe remote method model
 *
 * @export
 * @interface IModuleOptions
 */
export interface IModuleOptions {
  /**
   * Model events to include as part of this module, decorated with @ModelEvent
   *
   * @type {any[]}
   * @memberof IModuleOptions
   */
  events?: any[];
  /**
   * Whether or not this is a strict proxy - i.e returns an instance of this model instead of the
   * proxied one.
   *
   * @type {boolean}
   * @memberof IModuleOptions
   */
  strict?: boolean;
}

export interface IRemoteModuleOptions extends IModuleOptions {
  /**
   * The name of the model that this is a remote proxy for
   *
   * @type {string}
   * @memberof IModuleOptions
   */
  proxyFor?: string;
  /**
   * List of methods to proxy to the internal model e.g. ['findById', 'find']
   *
   * @type {string[]}
   * @memberof IModuleOptions
   */
  proxyMethods?: string[];
  /**
   * Remote methods to include as part of this module, decorated with @RemoteMethod
   *
   * @type {any[]}
   * @memberof IModuleOptions
   */
  remotes?: any[];
}

function makeLoopbackDectorator(handler: (Model: any) => void) {
  return function ModelModuleConfigure(ctor: Function) {
    // save a reference to the original constructor
    const Original: any = ctor;
    // the new constructor behaviour
    let f: any = function (...args: any[]) {
      let Model = args[0];
      handler(Model);

      return new Original(...args);
    }

    f.prototype = Original.prototype;
    return f;
  }
}

export function ModelModule(options: IModuleOptions) {
  return makeLoopbackDectorator((Model: any) => {
    (options.events || []).forEach((ModelEvent: any) => {
      let meta = Reflect.getMetadata('annotations', ModelEvent);
      meta.forEach(createEventMethod.bind({}, Model, ModelEvent));
    });
  });
}

export function RemoteMethodModule(options: IRemoteModuleOptions) {
  return makeLoopbackDectorator((Model: any) => {
    (options.remotes || []).forEach((RemoteMethod: any) => {
      let meta = Reflect.getMetadata('annotations', RemoteMethod);
      meta.forEach(createRemoteMethod.bind({}, Model, RemoteMethod));
    });
    if (!options.proxyFor) {
      return;
    }
    Model.getApp((err: Error, app: any) => {
      app.once('booted', () => configureProxy(Model, app, options));
    });
  });
}

function configureProxy(Model: any, app: any, options: IRemoteModuleOptions) {
  const ProxyFor = app.models[options.proxyFor];
  (options.proxyMethods || []).forEach(method => {
    if (method.indexOf('prototype.') === 0) {
      let methodName = method.split('.').pop();
      Model.prototype[methodName] = async function instance(
        ...args: any[]
      ) {
        let instance = this;
        if (this.toJSON) {
          let data = { ...this.toJSON() };
          if (this.isNewRecord()) {
            data.id = undefined;
          }
          instance = new ProxyFor(data);
          instance.__persisted = this.__persisted;
        }
        return await getResult(
          ProxyFor.prototype[methodName].bind(instance),
          Model,
          options.strict,
          args
        );
      };
    } else {
      Model[method] = async function (...args: any[]) {
        return await getResult(
          ProxyFor[method].bind(ProxyFor),
          Model,
          options.strict,
          args
        );
      };
    }
  });
}

async function getResult(
  callMethod: Function,
  ProxyModel: any,
  strict: boolean,
  args: any[]
) {
  let cb = getCallback(args);
  if (cb) {
    args = args.slice(0, -1);
  }
  try {
    let result = await callMethod(...args);
    if (strict) {
      result = mapResponse(ProxyModel, result);
    }
    if (cb) {
      cb(null, result);
    }
    return result;
  } catch (ex) {
    if (cb) {
      return cb(ex);
    }
    throw ex;
  }
}

function getCallback(...args: any[]) {
  if (typeof args[args.length - 1] === 'function') {
    return args[args.length - 1];
  }
  return false;
}

function mapResponse(ProxyModel: any, response: any) {
  if (Array.isArray(response)) {
    return response.map((res: any) => toProxy(ProxyModel, res));
  } else {
    return toProxy(ProxyModel, response);
  }
}

function toProxy(ProxyModel: any, res: any) {
  if (res && res.toJSON) {
    let result = new ProxyModel(res.toJSON());
    result.__persisted = res.__persisted;
    return result;
  } else {
    return res;
  }
}

export const RemoteMethod: any = makeDecorator('RemoteMethod', {
  selector: undefined,
  meta: undefined,
  providers: undefined,
});
export const ModelEvent: any = makeDecorator('ModelEvent', {
  selector: undefined,
  providers: undefined,
});
