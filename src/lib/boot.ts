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
      lbConfig.models[model.name] = {
        name: model.name,
        dataSource: null
      }
      lbConfig.modelDefinitions.push({
        definition: Reflect.getMetadata(modelDefinitionKey, model)
      });
    });

    boot(app, lbConfig, function (err: Error) {
      if (err) { return reject(err) }
      return resolve();
    });
  });
}