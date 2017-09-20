import {expect} from 'chai';
import {spy} from 'sinon';
const loopback = require('loopback');

import {Response} from '../index';
import {buildResponse, mapResponse, responseMetadataKey} from '../lib/response';

describe('mapResponse', () => {
  it('should map a loopback instance to a response', () => {
    function responseClass(payload: any) {
      this.result = payload.valid
    };
    let result = mapResponse(responseClass, {toJSON: () => ({invalid: 'foo', valid: 'bar'})});
    expect(result).to.have.property('result', 'bar');
  });

  it('should map an POJO to a response', () => {
    function responseClass(payload: any) {
      this.result = payload.valid
    };
    let result = mapResponse(responseClass, {invalid: 'foo', valid: 'bar'});
    expect(result).to.have.property('result', 'bar')
  });
});

describe('buildResponse', () => {
  it('should work if no metadata exists', () => {
    const result = {movie: 'Back to the Future'};
    const response = buildResponse(result, {});
    expect(response).to.equal(result);
  });

  it('should throw an error for models not defined on the registry', () => {
    const result = {movie: 'Back to the Future'};
    const remoteClass = {onRemote: () => {}};
    Reflect.defineMetadata(
        responseMetadataKey, {responseClass: 'NotReallyAModel'}, remoteClass, 'onRemote');
    expect(buildResponse.bind(null, result, remoteClass))
        .to.throw(`No model definition for NotReallyAModel found on the registry`);
  });

  it('should work for single results', () => {
    const result = {username: 'Marty McFly'};

    class remoteClass {
      @Response('User')
      onRemote() {}
    }
    const response = buildResponse(result, remoteClass);
    expect(response).to.be.an.instanceof (loopback.User);
    expect(response).to.have.property('username', 'Marty McFly');
  });

  it('should work for array results', () => {
    const result = [{username: 'Marty McFly'}, {username: 'Emmett Brown'}];
    class remoteClass {
      @Response(['User'])
      onRemote() {}
    }
    const response: any[] = buildResponse(result, remoteClass);
    expect(response).to.be.an('array').and.to.have.lengthOf(2);
    response.forEach(res => expect(res).to.be.an.instanceof (loopback.User));
  });

  context('Validation', () => {
    let ProxyModel: any, entity: any, withRelated: any;
    before(async () => {
      const InternalModelA = loopback.Model.extend(
          'InternalModelA', {existsKey: 'string', privateKey: 'string'},
          {strict: true, relations: {mb: {type: 'hasOne', model: 'InternalModelB'}}});
      const InternalModelB = loopback.Model.extend('InternalModelB', {relatedKey: 'string'});
      ProxyModel = loopback.Model.extend(
          'ProxyModel', {existsKey: 'string', mb: 'InternalModelB'}, {strict: true});
      [InternalModelA, InternalModelB, ProxyModel].forEach(mdl => mdl.attachTo(loopback.memory()));
      let internal = await InternalModelA.create({existsKey: 'ok', privateKey: 'secret'});
      await internal.mb.create({relatedKey: 'I am related'});
      entity = await InternalModelA.findOne();
      withRelated = await InternalModelA.findOne({include: 'mb'});
    });

    it('allows strict to filter out non-existant properties', () => {
      const response = mapResponse(ProxyModel, entity);
      // Should not have private key property
      expect(response.toJSON()).to.eql({id: 1, existsKey: 'ok', mb: undefined});
    });

    it('works for model relations', async () => {
      const response = mapResponse(ProxyModel, withRelated);
      // Should not have private key property
      expect(response.toJSON()).to.eql({
        id: 1,
        existsKey: 'ok',
        mb: {id: 1, internalModelAId: 1, relatedKey: 'I am related'}
      });
    });
  });
});