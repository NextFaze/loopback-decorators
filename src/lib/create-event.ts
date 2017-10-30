import { resolve } from './utils';
export function createEventMethod(
  RemoteClass: any,
  RemoteMethod: any,
  props: any
) {
  let { selector, providers } = props;
  RemoteClass.on(selector, async function(...args: any[]) {
    let proms = await resolve(RemoteClass, providers);
    let isNull = proms.indexOf(null);
    if (isNull > -1) {
      throw Error(
        `cannot instantiate ${RemoteMethod.name} provider at position: ${isNull} is null`
      );
    }
    return new RemoteMethod(...proms).onEvent(...args);
  });
}
