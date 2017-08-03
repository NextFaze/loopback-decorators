import 'reflect-metadata';

export function _normalizeRelations(providers: any[] = [], res: any = []) {
  providers.forEach(b => {
    if (typeof b === 'string') {
      res.push({provide: b, useToken: b});
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
export function resolve(instance: any, providers: any[]) {
  let normalized = _normalizeRelations(providers, []);
  let resolving = normalized.map((provider: any) => {
    if (typeof provider.useToken === 'string')
      return $resolve.call(instance, provider.useToken);
    else if (typeof provider.useFactory === 'function')
      return $resolve.call(instance, provider.deps)
          .then((resolved: any) => provider.useFactory.apply(instance, resolved));
  });
  return Promise.all(resolving);
}
export function getAsync(relation: string) {
  return this[relation].getAsync();
}

export function $resolve(dep: any = []) {
  if (Array.isArray(dep)) return Promise.all(dep.map(d => $resolve.call(this, d)));
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
