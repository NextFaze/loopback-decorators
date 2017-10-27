import { buildResponse } from './response';
import { resolve } from './utils';
import { validateArgs } from './validate';

export function createRemoteMethod(
  RemoteClass: any,
  RemoteMethod: any,
  props: any
) {
  let { selector, meta, providers } = props;
  if (meta.isStatic) {
    RemoteClass[selector] = async function(...args: any[]) {
      await validateArgs(args, RemoteMethod);
      let instance = this;
      let proms = await resolve(instance, providers);
      let isNull = proms.indexOf(null);
      if (isNull > -1) {
        throw Error(
          `cannot instantiate ${RemoteMethod.name} provider at position: ${isNull} is null`
        );
      }
      let result = await new RemoteMethod(...proms).onRemote(...args);
      return buildResponse(result, RemoteMethod);
    };
  } else {
    RemoteClass.prototype[selector] = async function(...args: any[]) {
      await validateArgs(args, RemoteMethod);
      let instance = this;
      let proms = await resolve(instance, providers);
      let isNull = proms.indexOf(null);
      if (isNull > -1) {
        throw Error(
          `cannot instantiate ${RemoteMethod.name} provider at position: ${isNull} is null`
        );
      }

      let result = await new RemoteMethod(...proms).onRemote(...args);
      return buildResponse(result, RemoteMethod);
    };
  }
  RemoteClass.remoteMethod(selector, meta);
}
