import { modelDefinitionKey } from './model';

const boot = require('loopback-boot');

export interface IBootOptions {
  providers: any[],
  appRootDir?: string;
  configRootDir?: string;
  dataSources: any;
  /**
   * List of model classes decorated with @Model
   */
  models: any[],
  middleware: any;
  components: any;
  env?: any;
  mixinSources: string[],
  bootScripts?: string[]
}

export function nfBoot(app: any, config: any): Promise<any> {
  let lbConfig = { ...config };
  return new Promise((resolve: Function, reject: Function) => {
    lbConfig.models = {};
    lbConfig.modelDefinitions = [];
    config.models.forEach((model: any) => {
      const definition = Reflect.getMetadata(modelDefinitionKey, model)
      if (definition) {
        lbConfig.models[model.name] = {
          name: model.name,
          ...definition.config
        }
        lbConfig.modelDefinitions.push({
          definition
        });
      } else if (model.provide) {
        let value = model.useFactory ? model.useFactory : model.useValue;
        lbConfig.models[model.provide] = {
          name: model.provide,
          ...value.config
        };
        lbConfig.modelDefinitions.push(value.definition);
      }
    });

    boot(app, lbConfig, function (err: Error) {
      if (err) { return reject(err) }
      return resolve();
    });
  });
}