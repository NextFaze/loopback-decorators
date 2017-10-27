import 'reflect-metadata';

import {createEventMethod} from './lib/create-event';
import {createRemoteMethod} from './lib/create-remote';
import {makeDecorator} from './lib/type-decorators';

export {Response} from './lib/response';
export {Validate} from './lib/validate';

/**
 * Configuration for the remote method model
 *
 * @export
 * @interface IModuleOptions
 */
export interface IModuleOptions {
  /**
   * Remote methods to include as part of this module, decorated with @RemoteMethod
   *
   * @type {any[]}
   * @memberof IModuleOptions
   */
  remotes?: any[];
  /**
   * Model events to include as part of this module, decorated with @ModelEvent
   *
   * @type {any[]}
   * @memberof IModuleOptions
   */
  events?: any[];
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
}

export function RemoteMethodModule(options: IModuleOptions) {
  return function RemoteMethodModule(ctor: Function) {
    // save a reference to the original constructor
    const Original: any = ctor;

    // the new constructor behaviour
    let f: any = function(...args: any[]) {
      let Model = args[0];
      if (options.proxyFor) {
        Model.getApp((err: Error, app: any) => {
          app.once('booted', () => {
            const ProxyFor = app.models[options.proxyFor];
            (options.proxyMethods || []).forEach(method => {
              if (method.indexOf('prototype.') === 0) {
                let methodName = method.split('.').pop();
                Model.prototype[methodName] = function instance() {
                  this.constructor = ProxyFor;
                  ProxyFor.prototype[methodName].apply(this, arguments);
                }
              } else {
                Model[method] = ProxyFor[method].bind(ProxyFor);
              }
            });
          });
        });
      }

      (options.remotes || []).forEach((RemoteMethod: any) => {
        let meta = Reflect.getMetadata('annotations', RemoteMethod);
        meta.forEach(createRemoteMethod.bind({}, Model, RemoteMethod));
      });
      (options.events || []).forEach((ModelEvent: any) => {
        let meta = Reflect.getMetadata('annotations', ModelEvent);
        meta.forEach(createEventMethod.bind({}, Model, ModelEvent));
      });
      return new Original(...args);
    };
    f.prototype = Original.prototype;
    return f;
  };
}

export const RemoteMethod: any = <any>makeDecorator(
    'RemoteMethod', {selector: undefined, meta: undefined, providers: undefined});
export const ModelEvent: any =
    <any>makeDecorator('ModelEvent', {selector: undefined, providers: undefined});
