import 'reflect-metadata';

export const validateMetadataKey = Symbol('validates');

export function Validate(target: Object, propertyKey: string|symbol, parameterIndex: number) {
  let existingRequiredParameters: number[] =
      Reflect.getOwnMetadata(validateMetadataKey, target.constructor, propertyKey) || [];
  existingRequiredParameters.push(parameterIndex);
  Reflect.defineMetadata(
      validateMetadataKey, existingRequiredParameters, target.constructor, propertyKey);
}
