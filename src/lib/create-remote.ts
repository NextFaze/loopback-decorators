import {resolve} from './utils';
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
      return new RemoteMethod(...proms).onRemote(...args);
    };
  }
  RemoteClass.remoteMethod(selector, meta);
}
