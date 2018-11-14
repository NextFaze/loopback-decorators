import { RemoteMethodModule, RemoteMethod } from '..';
import { expect } from 'chai';
import { spy } from 'sinon';

const loopback = require('loopback');
const request = require('supertest');

describe('@RemoteMethod', () => {
  context('Decorator', () => {
    let app: any, model: any, instance: any;
    before(async () => {
      ({ app, model } = setupLoopbackApplication());
      @RemoteMethod({
        selector: 'ping',
        meta: {
          isStatic: true,
          returns: {
            arg: 'res',
            type: 'string',
            root: true,
          },
          http: {
            verb: 'get',
            path: '/ping',
          },
        },
      })
      class StaticRemoteClass {
        onRemote() {
          return 'pong';
        }
      }

      @RemoteMethod({
        selector: 'ping',
        meta: {
          isStatic: false,
          returns: {
            arg: 'res',
            type: 'string',
            root: true,
          },
          http: {
            verb: 'get',
            path: '/ping',
          },
        },
      })
      class InstanceRemoteClass {
        onRemote() {
          return 'InstancePong';
        }
      }

      @RemoteMethodModule({
        remotes: [StaticRemoteClass, InstanceRemoteClass],
      })
      class ModelClass {
        constructor(public model: any) {}
      }

      const decorated = new ModelClass(model);
      instance = await model.create({});
    });

    it('Sets up a static remote method', () => {
      return request(app)
        .get(`/${model.modelName}s/ping`)
        .expect(200)
        .then((res: any) => {
          expect(res.body).to.eql('pong');
        });
    });

    it('Sets up an instance remote method', () => {
      return request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200)
        .then((res: any) => {
          expect(res.body).to.eql('InstancePong');
        });
    });
  });

  context('Providers', () => {
    let methodSpy: any, instance: any, model: any, app: any;
    beforeEach(async () => {
      methodSpy = spy((args: any[]) => {});
      ({ app, model } = setupLoopbackApplication());
      instance = await model.create();
    });

    it('can provide the model', async () => {
      const remote = setupRemoteWithDep('$model');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200);
      expect(methodSpy.args[0][0].modelName).to.eql(model.modelName);
      expect(methodSpy.args[0][0].create).to.be.ok;
    });

    it('can provide the instance', async () => {
      const remote = setupRemoteWithDep('$instance');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200);
      expect(methodSpy.args[0][0].id).to.eql(instance.id);
    });

    it('can provide the app', async () => {
      const remote = setupRemoteWithDep('$app');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200);
      expect(methodSpy.args[0][0].models).to.be.ok.and.to.have.property(
        model.modelName
      );
    });

    it('can provide the remoting context', async () => {
      const remote = setupRemoteWithDep('$ctx');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200);
      expect(methodSpy.args[0][0].res.render).to.be.a('Function').and.to.be.ok;
    });

    it('can provide the remoting request', async () => {
      const remote = setupRemoteWithDep('$req');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200);
      expect(methodSpy.args[0][0].headers).to.be.ok;
    });

    it('can provide the remoting response', async () => {
      const remote = setupRemoteWithDep('$res');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .expect(200);
      expect(methodSpy.args[0][0].render).to.be.a('Function').and.to.be.ok;
    });

    it('can provide the request headers', async () => {
      const remote = setupRemoteWithDep('$headers');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .set('Authorization', 'abc123')
        .expect(200);
      expect(methodSpy.args[0][0].authorization).to.eql('abc123');
    });

    it('should support fishing arbitrary context information', async () => {
      const remote = setupRemoteWithDep('$req.headers.accept');
      const { body } = await request(app)
        .get(`/${model.modelName}s/${instance.id}/ping`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(methodSpy.args[0][0]).to.eql('application/json');
    });

    function setupRemoteWithDep(dep: any) {
      @RemoteMethod({
        selector: 'ping',
        providers: [dep],
        meta: {
          isStatic: false,
          returns: {
            arg: 'res',
            type: 'string',
            root: true,
          },
          http: {
            verb: 'get',
            path: '/ping',
          },
        },
      })
      class InstnaceRemoteClass {
        constructor(...args: any[]) {
          methodSpy(...args);
        }
        onRemote() {
          return true;
        }
      }

      @RemoteMethodModule({
        remotes: [InstnaceRemoteClass],
      })
      class ModelClass {
        constructor(public model: any) {}
      }

      const decorated = new ModelClass(model);
    }
  });
});

function setupLoopbackApplication() {
  const app = loopback();
  const model = app.registry.createModel(`TestModel${Date.now()}`);
  app.use(loopback.rest());
  app.set('remoting', { errorHandler: { debug: true, log: false } });
  app.dataSource('test', { connector: 'memory' });
  app.model(model, { dataSource: 'test' });

  return {
    app,
    model,
  };
}
