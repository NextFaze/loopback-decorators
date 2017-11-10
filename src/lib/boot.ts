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
  let lbConfig = config;
  return new Promise((resolve: Function, reject: Function) => {
    boot(app, lbConfig, function (err: Error) {
      if (err) { return reject(err) }
      return resolve();
    });
  });
}