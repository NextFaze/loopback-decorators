import 'reflect-metadata';

export const validateMetadataKey = Symbol('validates');

const ValidationError = require('loopback').ValidationError;

export function Validate(
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) {
  let existingRequiredParameters: number[] =
    Reflect.getOwnMetadata(
      validateMetadataKey,
      target.constructor,
      propertyKey
    ) || [];
  existingRequiredParameters.push(parameterIndex);
  Reflect.defineMetadata(
    validateMetadataKey,
    existingRequiredParameters,
    target.constructor,
    propertyKey
  );
}

export function validateArgs(args: any[], RemoteMethod: any) {
  let validatesMeta =
    Reflect.getOwnMetadata(validateMetadataKey, RemoteMethod, 'onRemote') || [];
  let validations = validatesMeta.map((idx: number) => getValid(args[idx]));
  return Promise.all(validations);
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
