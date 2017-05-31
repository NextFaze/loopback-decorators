import {join} from 'path';
import {argv} from 'yargs';

export const BUILD_TYPES = {
  DEVELOPMENT: 'dev',
  PRODUCTION: 'prod'
};
export class SeedConfig {
  APP_SRC = 'src';
  APP_PROJECTNAME = 'tsconfig.json';
  TOOLS_DIR = 'tools';
  SEED_TASKS_DIR = join(process.cwd(), this.TOOLS_DIR, 'tasks', 'seed');
  TEMP_FILES: string[] = [
    '**/*___jb_tmp___',
    '**/*~',
  ];
  DIST_DIR = 'dist';
  DEV_DEST = `${this.DIST_DIR}/dev`;
  PROD_DEST = `${this.DIST_DIR}/prod`;
  BUILD_TYPE = getBuildType();
  APP_DEST = this.BUILD_TYPE === BUILD_TYPES.DEVELOPMENT ? this.DEV_DEST : this.PROD_DEST;
  TYPED_COMPILE_INTERVAL = 0;
  SEED_COMPOSITE_TASKS = join(process.cwd(), this.TOOLS_DIR, 'config', 'seed.tasks.json');
  PROJECT_ROOT = join(__dirname, '../..');
}
function getBuildType() {
  let type = (argv['build-type'] || argv['env'] || '').toLowerCase();
  let base: string[] = argv['_'];
  let prodKeyword = !!base.filter(o => o.indexOf(BUILD_TYPES.PRODUCTION) >= 0).pop();
  if ((base && prodKeyword) || type === BUILD_TYPES.PRODUCTION) {
    return BUILD_TYPES.PRODUCTION;
  } else {
    return BUILD_TYPES.DEVELOPMENT;
  }
}
