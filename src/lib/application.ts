import { nfBoot } from './boot';

export const APP_TOKEN = 'app';

export function LoopbackApplication(config: any) {
  return function (target: any) {
    const booter: any = function () {
      let appProvider = config.providers.find((val: any) => val.provide === APP_TOKEN);
      let app: any;
      if (appProvider.useFactory) {
        app = appProvider.useFactory();
      }
      if (appProvider.useValue) {
        app = appProvider.useValue;
      }
      let inst: any = new target(app);
      nfBoot(app, config)
        .then(() => {
          app.start = () => app.listen(() => inst.onStart());
          inst.onBoot.call(inst);
        });
      return inst;
    }
    return booter;
  }
}