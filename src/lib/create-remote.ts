import { buildResponse, responseMetadataKey } from './response';
import { resolve } from './utils';
import { validateArgs } from './validate';

export function createRemoteMethod(
  RemoteClass: any,
  RemoteMethod: any,
  props: any
) {
  let { selector, meta, providers } = props;

  // Inject context into the accepts that we can use
  let accepts = meta ? meta.accepts || [] : [];
  if (!Array.isArray(accepts)) {
    accepts = [accepts];
  }
  meta.accepts = [
    {
      arg: 'decoratorsContext',
      type: 'object',
      http: (ctx: any) => ctx,
    },
  ].concat(accepts);

  if (meta.isStatic) {
    RemoteClass[selector] = async function(...allArgs: any[]) {
      // Pop off loopback decorators injected context
      const { args, ctx } = extractRemoteContext(allArgs);
      await validateArgs(args, RemoteMethod);
      let instance = this;
      let proms = await resolve(ctx, instance, providers);
      let isNull = proms.indexOf(null);
      if (isNull > -1) {
        throw Error(
          `cannot instantiate ${
            RemoteMethod.name
          } provider at position: ${isNull} is null`
        );
      }
      let result = await new RemoteMethod(...proms).onRemote(...args);
      return buildResponse(result, RemoteMethod);
    };
  } else {
    RemoteClass.prototype[selector] = async function(...allArgs: any[]) {
      // Pop off loopback decorators injected context
      const { args, ctx } = extractRemoteContext(allArgs);
      await validateArgs(args, RemoteMethod);
      let instance = this;
      let proms = await resolve(ctx, instance, providers);
      let isNull = proms.indexOf(null);
      if (isNull > -1) {
        throw Error(
          `cannot instantiate ${
            RemoteMethod.name
          } provider at position: ${isNull} is null`
        );
      }

      let result = await new RemoteMethod(...proms).onRemote(...args);
      return buildResponse(result, RemoteMethod);
    };
  }

  function extractRemoteContext(args: any[]) {
    let [ctx] = args;
    // Duck type to remoting context
    if (!ctx || !ctx.req || !ctx.res) {
      ctx = {};
    } else {
      args = args.slice(1);
    }
    return {
      ctx,
      args,
    };
  }
  RemoteClass.remoteMethod(selector, meta);
}
