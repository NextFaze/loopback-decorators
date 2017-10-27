export const responseMetadataKey = Symbol('response');
const loopback = require('loopback');

export abstract class ModelResponseInstance {
  toJSON?: () => {
    [key: string]: any;
  };
  [key: string]: any;
}

export interface IResponseConfig {
  responseClass: string;
  isMulti?: boolean;
}

export function Response(config: string | IResponseConfig | string[]) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    if (typeof config === 'string') {
      config = { responseClass: config, isMulti: false };
    } else if (Array.isArray(config)) {
      config = { responseClass: config.pop(), isMulti: true };
    }
    Reflect.defineMetadata(
      responseMetadataKey,
      config,
      target.constructor,
      propertyKey
    );
  };
}

export function buildResponse(result: any, RemoteClass: any) {
  const meta: IResponseConfig = Reflect.getOwnMetadata(
    responseMetadataKey,
    RemoteClass,
    'onRemote'
  );
  if (!meta) {
    return result;
  }

  const { isMulti, responseClass } = meta;
  let ResponseClass;
  ResponseClass = loopback.registry.modelBuilder.models[responseClass];
  if (!ResponseClass) {
    throw new Error(
      `No model definition for ${responseClass} found on the registry`
    );
  }

  return isMulti
    ? result.map(mapResponse.bind(null, ResponseClass))
    : mapResponse(ResponseClass, result);
}

export function mapResponse(
  ResponseClass: any,
  instance: ModelResponseInstance
) {
  if (typeof instance.toJSON === 'function') {
    return new ResponseClass(instance.toJSON());
  }
  return new ResponseClass(instance);
}
