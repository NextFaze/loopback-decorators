import {existsSync, lstatSync, readdirSync, readFileSync} from 'fs';
import * as gulp from 'gulp';
import * as util from 'gulp-util';
const isstream = require('isstream');
import {join} from 'path';
import * as runSequence from 'run-sequence';

import {Task} from '../../tasks/task';

import {changeFileManager} from './code_change_tools';

const tildify = require('tildify');
export function loadCompositeTasks(seedTasksFile: string, projectTasksFile: string): void {
  let seedTasks: any;
  let projectTasks: any;
  try {
    seedTasks = JSON.parse(readFileSync(seedTasksFile).toString());
    projectTasks = JSON.parse(readFileSync(projectTasksFile).toString());
  } catch (e) {
    util.log('Cannot load the task configuration files: ' + e.toString());
    return;
  }
  [[seedTasks, seedTasksFile], [projectTasks, projectTasksFile]].forEach(
      ([tasks, file]: [string, string]) => {
        const invalid = validateTasks(tasks);
        if (invalid.length) {
          const errorMessage = getInvalidTaskErrorMessage(invalid, file);
          util.log(util.colors.red(errorMessage));
          process.exit(1);
        }
      });
  const mergedTasks = Object.assign({}, seedTasks, projectTasks);
  registerTasks(mergedTasks);
}
function registerTasks(tasks: any) {
  Object.keys(tasks).forEach((t: string) => {
    gulp.task(t, (done: any) => runSequence.apply(null, [...tasks[t], done]));
  });
}
function getInvalidTaskErrorMessage(invalid: string[], file: string) {
  let error = `Invalid configuration in "${file}. `;
  if (invalid.length === 1) {
    error += 'Task';
  } else {
    error += 'Tasks';
  }
  error += ` ${invalid.map((t: any) => `
  '${t}'
  `).join(', ')} do not have proper format.`;
  return error;
}
function validateTasks(tasks: any) {
  return Object.keys(tasks)
      .map((taskName: string) => {
        if (!tasks[taskName] || !Array.isArray(tasks[taskName]) ||
            tasks[taskName].some((t: any) => typeof t !== 'string')) {
          return taskName;
        }
        return null;
      })
      .filter((taskName: string) => !!taskName);
}
export function loadTasks(path: string): void {
  util.log('Loading tasks folder', util.colors.yellow(path));
  readDir(path, taskname => registerTask(taskname, path));
}
function registerTask(taskname: string, path: string): void {
  const TASK = join(path, taskname);
  util.log('Registering task', util.colors.yellow(tildify(TASK)));

  gulp.task(taskname, (done: any) => {
    const task = normalizeTask(require(TASK), TASK);

    if (changeFileManager.pristine || task.shallRun(changeFileManager.lastChangedFiles)) {
      const result = task.run(done);
      if (result && typeof result.catch === 'function') {
        result.catch((e: any) => { util.log(`Error while running "${TASK}"`, e); });
      }
      return result;
    } else {
      done();
    }
  });
}

function readDir(root: string, cb: (taskname: string) => void) {
  if (!existsSync(root)) {
    return;
  }

  walk(root);

  function walk(path: string) {
    let files = readdirSync(path);
    for (let i = 0; i < files.length; i += 1) {
      let file = files[i];
      let curPath = join(path, file);
      if (lstatSync(curPath).isFile() && /\.ts$/.test(file)) {
        let taskname = file.replace(/\.ts$/, '');
        cb(taskname);
      }
    }
  }
}
function normalizeTask(task: any, taskName: string) {
  if (task instanceof Task) {
    return task;
  }
  if (task.prototype && task.prototype instanceof Task) {
    return new task();
  }
  if (typeof task === 'function') {
    return new class AnonTask extends Task {
      run(done: any) {
        if (task.length > 0) {
          return task(done);
        }

        const taskReturnedValue = task();
        if (isstream(taskReturnedValue)) {
          return taskReturnedValue;
        }

        done();
      }
    };
  }
  throw new Error(
      taskName + ' should be instance of the class ' +
      'Task, a function or a class which extends Task.');
}
