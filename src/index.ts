import 'reflect-metadata';

import {createEventMethod} from './lib/create-event';
import {createRemoteMethod} from './lib/create-remote';
import {makeDecorator} from './lib/type-decorators';

export function RemoteMethodModule(options: any) {
  return function RemoteMethodModule(ctor: Function) {
    // save a reference to the original constructor
    const Original: any = ctor;

    // the new constructor behaviour
    let f: any = function(...args: any[]) {
      let Model = args[0];
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
};
export const RemoteMethod: any = <any>makeDecorator(
    'RemoteMethod', {selector: undefined, meta: undefined, providers: undefined});
export const ModelEvent: any =
    <any>makeDecorator('ModelEvent', {selector: undefined, providers: undefined});
