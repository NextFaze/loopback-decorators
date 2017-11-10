export export const modelDefinitionKey = `modelDefinition`);
export function Model(modelConfig: any) {
  return function (target: any) {
    Reflect.defineMetadata(modelDefinitionKey, modelConfig, target);
  }
}