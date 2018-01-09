import { buildResponse } from './response';
import { resolve, _normalizeRelations } from './utils';
import { validateArgs } from './validate';

export function createRemoteMethod(
  RemoteClass: any,
  RemoteMethod: any,
  props: any
) {
  let { selector, meta, providers } = props;
  providers = _normalizeRelations(providers);
  updateMetaAcceptsWithProviders(meta, providers);
  if (meta.isStatic) {
    RemoteClass[selector] = async function(...args: any[]) {
      await validateArgs(args, RemoteMethod);
      let instance = this;
      let proms = await resolve(instance, providers, args);
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
    RemoteClass.prototype[selector] = async function(...args: any[]) {
      await validateArgs(args, RemoteMethod);
      let instance = this;
      let proms = await resolve(instance, providers, args);
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
  RemoteClass.remoteMethod(selector, meta);
}

export function updateMetaAcceptsWithProviders(
  meta: any = {},
  providers: any[] = []
) {
  if (hasContextProviders(providers)) {
    meta.accepts = meta.accepts || [];
    meta.accepts.push({
      arg: 'ctx',
      type: 'any',
      http: function(context: any) {
        return context;
      },
    });
  }
}

function hasContextProviders(providers: any[] = []) {
  return !!providers.find(
    item => CTX_PROVIDERS.includes(item.provide) || item.provide.startsWith('@')
  );
}

export const Application = Symbol('Application');
export const ModelInstance = Symbol('Instance');

export const RemotingContext = Symbol('Context');
export const Req = Symbol('Request');
export const Res = Symbol('Response');
export const AccessToken = Symbol('AccessToken');
export const Headers = Symbol('AccessToken');
export const CTX_PROVIDERS = [RemotingContext, Req, Res, AccessToken, Headers];
