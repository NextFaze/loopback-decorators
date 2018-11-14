import 'reflect-metadata';

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
export function resolve(httpContext: any, instance: any, providers: any[]) {
  let normalized = _normalizeRelations(providers, []);
  let resolving = normalized.map((provider: any) => {
    if (typeof provider.useToken === 'string')
      return $resolve.call(instance, httpContext, provider.useToken);
    else if (typeof provider.useFactory === 'function')
      return $resolve
        .call(instance, httpContext, provider.deps)
        .then((resolved: any) => provider.useFactory.apply(instance, resolved));
  });
  return Promise.all(resolving);
}
export function getAsync(relation: string) {
  return this[relation].getAsync();
}

export function $resolve(httpContext: any, dep: any = []) {
  if (Array.isArray(dep))
    return Promise.all(dep.map(d => $resolve.call(this, httpContext, d)));
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
    case '$instance': {
      if (typeof this === 'object') {
        return this;
      } else {
        throw new Error('Instance not available in this ctx');
      }
    }
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
    case '$ctx': {
      return httpContext;
    }
    case '$req': {
      return httpContext.req;
    }
    case '$headers': {
      return httpContext.req.headers;
    }
    case '$res': {
      return httpContext.res;
    }
    case '$optionsFromRequest':
    case '$options': {
      return createOptionsViaModelMethod(httpContext);
    }
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

  if (dep.split('.').length > 1) {
    try {
      // Try to fish out of context argument
      return dep
        .slice(1)
        .split('.')
        .reduce((prev: any, next: string) => prev[next], httpContext);
    } catch (ex) {}
  }
  // Final fallback - to resolve as a method on the model
  try {
    return getAsync.call(this, dep);
  } catch (ex) {
    throw new Error(`Unable to resolve dependency ${dep}`);
  }
}

// https://github.com/strongloop/loopback/blob/1c30628a8a15aca412de6b6f34036ff979e675f8/lib/model.js#L494-L503
function createOptionsViaModelMethod(ctx: any) {
  var EMPTY_OPTIONS = {};
  var ModelCtor = ctx.method && ctx.method.ctor;
  if (!ModelCtor) return EMPTY_OPTIONS;
  if (typeof ModelCtor.createOptionsFromRemotingContext !== 'function')
    return EMPTY_OPTIONS;
  return ModelCtor.createOptionsFromRemotingContext(ctx);
}
