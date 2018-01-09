import 'reflect-metadata';
import {
  Request,
  Application,
  ModelInstance,
  Response,
  AccessToken,
  RemotingContext,
  Headers,
} from './create-remote';

export function _normalizeRelations(providers: any[] = [], res: any = []) {
  providers.forEach(b => {
    if (typeof b === 'string') {
      res.push({ provide: b, useToken: b });
    } else if (b && typeof b === 'object' && (b as any).provide !== undefined) {
      res.push(b);
    } else if (b instanceof Array) {
      _normalizeRelations(b, res);
    } else {
      throw new Error('Invalid provider error');
    }
  });
  return res;
}
export function resolve(instance: any, providers: any[], args: any[]) {
  let normalized = _normalizeRelations(providers, []);
  let resolving = normalized.map((provider: any) => {
    if (typeof provider.useToken === 'string')
      return $resolve.call(instance, provider.useToken, args);
    else if (typeof provider.useFactory === 'function')
      return $resolve
        .call(instance, provider.deps, args)
        .then((resolved: any) => provider.useFactory.apply(instance, resolved));
  });
  return Promise.all(resolving);
}
export function getAsync(relation: string) {
  return this[relation].getAsync();
}

export function $resolve(dep: any = [], args: any[]) {
  if (Array.isArray(dep))
    return Promise.all(dep.map(d => $resolve.call(this, d)));
  switch (dep) {
    case '$model': {
      if (typeof this === 'object') {
        return this.constructor;
      } else if (typeof this === 'function') {
        return this;
      } else {
        throw new Error('Model is not object or function');
      }
    }
    case ModelInstance:
    case '$instance': {
      if (typeof this === 'object') {
        return this;
      } else {
        throw new Error('Instance not available in this ctx');
      }
    }
    case Application:
    case '$app': {
      return new Promise((resolve, reject) => {
        if (typeof this === 'object') {
          this.constructor.getApp((err: any, app: any) => {
            if (err) return reject(err);
            return resolve(app);
          });
        } else if (typeof this === 'function') {
          this.getApp((err: any, app: any) => {
            if (err) return reject(err);
            return resolve(app);
          });
        }
      });
    }
    case RemotingContext:
    case Request:
    case Response:
    case AccessToken:
    case Headers: {
      let ctx = findContextArgument(args);
      if (!ctx) {
        throw new Error('Failed to resolve context argument for this function');
      }
      return Promise.resolve(resolveFromContext(dep, ctx));
    }
  }
  if (dep.startsWith('@')) {
    let ctx = findContextArgument(args);
    if (!ctx) {
      throw new Error('Failed to resolve context argument for this function');
    }
    return Promise.resolve(resolveFromContext(dep, ctx));
  }
  if (dep[0] === '^') {
    return new Promise((resolve, reject) => {
      if (typeof this === 'object') {
        this.constructor.getApp((err: any, app: any) => {
          if (err) return reject(err);
          return resolve(app.models[dep.slice(1)]);
        });
      } else if (typeof this === 'function') {
        this.getApp((err: any, app: any) => {
          if (err) return reject(err);
          return resolve(app.models[dep.slice(1)]);
        });
      }
    });
  }
  return getAsync.call(this, dep);
}

export function findContextArgument(args: any[]) {
  // If this does not work, may need to resort to duck-typing against the array.
  return args[args.length - 2];
}

export function resolveFromContext(arg: any, ctx: any) {
  switch (arg) {
    case RemotingContext:
    case '@':
    case '@ctx':
    case '@context':
      return ctx;
    case Request:
      return ctx.req;
    case Response:
    case AccessToken:
    case '@accessToken':
      return ctx.req.accessToken;
    case Headers:
    case '@headers':
      return ctx.req.headers;
  }
  if (arg.startsWith('@')) {
    return arg
      .slice(1)
      .split('.')
      .reduce((prev: any, next: string) => prev[next], ctx);
  }
}
