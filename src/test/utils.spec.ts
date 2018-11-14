import * as chai from 'chai';
import * as promised from 'chai-as-promised';

import { $resolve, _normalizeRelations, getAsync, resolve } from '../lib/utils';

chai.use(promised);
import { expect } from 'chai';
import { spy } from 'sinon';
import 'mocha';

describe('Normalize Relations', () => {
  it('should normalize string providers', () => {
    const res = _normalizeRelations(['myProvider']);
    expect(res).to.deep.equal(
      [{ provide: 'myProvider', useToken: 'myProvider' }],
      'should turn it into an object'
    );
  });

  it('should add object providers', () => {
    const provider = { provide: 'myProvider', useToken: 'someProvider' };
    const res = _normalizeRelations([provider]);
    expect(res)
      .to.be.an('array')
      .and.to.contain(provider);
  });

  it('should normalize array providers', () => {
    const provider = [{ provide: 'myProvider', useToken: 'someProvider' }];
    const res = _normalizeRelations([provider]);
    expect(res)
      .to.be.an('array')
      .and.to.contain(provider[0]);
  });

  it('should error an invalid provider', () => {
    const provider = false;
    expect(_normalizeRelations.bind(null, [provider])).to.throw();
  });
});

describe('$resolve', () => {
  it('should resolve the source model dep', async () => {
    const mockCtor = () => {};
    const mockInstance = { constructor: mockCtor };
    await expect($resolve.call(mockInstance, {}, ['$model'])).to.eventually.eql(
      [mockCtor]
    );
    await expect($resolve.call(mockCtor, {}, ['$model'])).to.eventually.eql([
      mockCtor,
    ]);
  });

  it('should resolve an instance dep', async () => {
    const mockInstance = {};
    await expect(
      $resolve.call(mockInstance, {}, ['$instance'])
    ).to.eventually.eql([mockInstance]);
  });

  it('should resolve the app', async () => {
    const app = {};
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    const mockInstance = { constructor: mockCtor };
    await expect($resolve.call(mockInstance, {}, ['$app'])).to.eventually.eql([
      app,
    ]);
    await expect($resolve.call(mockCtor, {}, ['$app'])).to.eventually.eql([
      app,
    ]);
  });

  it('should resolve the http context', async () => {
    const app = {};
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    const mockInstance = { constructor: mockCtor };
    const ctx = { req: {}, res: {} };
    await expect($resolve.call(mockInstance, ctx, ['$ctx'])).to.eventually.eql([
      ctx,
    ]);
    await expect($resolve.call(mockCtor, ctx, ['$ctx'])).to.eventually.eql([
      ctx,
    ]);
  });

  it('should resolve the http request', async () => {
    const app = {};
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    const mockInstance = { constructor: mockCtor };
    const req = { method: 'POST' };
    await expect(
      $resolve.call(mockInstance, { req }, ['$req'])
    ).to.eventually.eql([req]);
    await expect($resolve.call(mockCtor, { req }, ['$req'])).to.eventually.eql([
      req,
    ]);
  });

  it('should resolve the http request', async () => {
    const app = {};
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    const mockInstance = { constructor: mockCtor };
    const req = { headers: { 'Content-Type': 'application/json' } };
    await expect(
      $resolve.call(mockInstance, { req }, ['$req'])
    ).to.eventually.eql([req]);
    await expect(
      $resolve.call(mockCtor, { req }, ['$headers'])
    ).to.eventually.eql([{ 'Content-Type': 'application/json' }]);
  });

  it('should resolve the http response', async () => {
    const app = {};
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    const mockInstance = { constructor: mockCtor };
    const res = { statusCode: 200 };
    await expect(
      $resolve.call(mockInstance, { res }, ['$res'])
    ).to.eventually.eql([res]);
    await expect($resolve.call(mockCtor, { res }, ['$res'])).to.eventually.eql([
      res,
    ]);
  });

  it('should resolve the http request options', async () => {
    const app = {};
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    (<any>mockCtor).createOptionsFromRemotingContext = () => 'FOO';
    const mockInstance = { constructor: mockCtor };
    const ctx = {
      method: {
        ctor: mockCtor,
      },
    };
    await expect(
      $resolve.call(mockInstance, ctx, ['$options'])
    ).to.eventually.eql(['FOO']);
    await expect($resolve.call(mockCtor, ctx, ['$options'])).to.eventually.eql([
      'FOO',
    ]);
    await expect(
      $resolve.call(mockInstance, ctx, ['$optionsFromRequest'])
    ).to.eventually.eql(['FOO']);
    await expect(
      $resolve.call(mockCtor, ctx, ['$optionsFromRequest'])
    ).to.eventually.eql(['FOO']);
  });

  it('should resolve a model dep', async () => {
    const app = { models: { Danklords: {} } };
    const mockCtor = () => {};
    (<any>mockCtor).getApp = (cb: Function) => cb(null, app);
    const mockInstance = { constructor: mockCtor };
    await expect(
      $resolve.call(mockInstance, {}, ['^Danklords'])
    ).to.eventually.eql([app.models.Danklords]);
    await expect($resolve.call(mockCtor, {}, ['^Danklords'])).to.eventually.eql(
      [app.models.Danklords]
    );
  });

  it('should resolve a relation dep', async () => {
    const mockInstance = {
      relations: { getAsync: () => Promise.resolve('Some relations') },
    };
    await expect(
      $resolve.call(mockInstance, {}, ['relations'])
    ).to.eventually.eql(['Some relations']);
  });
});

describe('resolve', () => {
  it('should resolve a custom dep', async () => {
    const useFactory = () => Promise.resolve('Pretty dank');
    await expect(
      resolve({}, {}, [{ provide: 'status', useFactory }])
    ).to.eventually.eql(['Pretty dank']);
  });
});

describe('getAsync', () => {
  it('should fetch the relation from the model', () => {
    let mockModel = { relateds: { getAsync: spy(() => true) } };
    expect(getAsync.call(mockModel, 'relateds')).to.be.ok;
    expect(mockModel.relateds.getAsync.calledOnce).to.be.ok;
  });
});
