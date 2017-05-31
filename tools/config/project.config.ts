import {join} from 'path';

import {SeedConfig} from './seed.config'
export class ProjectConfig extends SeedConfig {
  PROJECT_TASKS_DIR = join(process.cwd(), this.TOOLS_DIR, 'tasks', 'project');
  PROJECT_COMPOSITE_TASKS = join(process.cwd(), this.TOOLS_DIR, 'config', 'project.tasks.json');
  constructor() { super()}
}
