import {resolve} from './utils';
import {validateMetadataKey} from './validate';
const ValidationError = require('loopback').ValidationError;

export function createRemoteMethod(RemoteClass: any, RemoteMethod: any, props: any) {
  let {selector, meta, providers} = props;
  if (meta.isStatic) {
    RemoteClass[selector] = async function(...args: any[]) {
      let instance = this;
      let proms = await resolve(instance, providers);
      let isNull = proms.indexOf(null);
      if (isNull > -1) {
        throw Error(
            `cannot instantiate ${RemoteMethod.name} provider at position: ${isNull} is null`);
      }
      return new RemoteMethod(...proms).onRemote(...args);
    };
  } else {
    RemoteClass.prototype[selector] = async function(...args: any[]) {
      let instance = this;
      let proms = await resolve(instance, providers);
      let isNull = proms.indexOf(null);
      if (isNull > -1) {
        throw Error(
            `cannot instantiate ${RemoteMethod.name} provider at position: ${isNull} is null`);
      }

      function getValid(mdl: any) {
        return new Promise((res: Function, rej: Function) => {
          mdl.isValid((isValid: boolean) => {
            if (isValid) {
              return res();
            } else {
              return rej(new ValidationError(mdl));
            }
          });
        });
      }

      let validatesMeta =
          Reflect.getOwnMetadata(validateMetadataKey, RemoteMethod, 'onRemote') || [];
      let validations = validatesMeta.map((idx: number) => getValid(args[idx]));
      await Promise.all(validations);

      return new RemoteMethod(...proms).onRemote(...args);
    };
  }
  RemoteClass.remoteMethod(selector, meta);
}
