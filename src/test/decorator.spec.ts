import {expect} from 'chai';

import {RemoteMethodModule} from '../';

const loopback = require('loopback');

describe('@RemoteMethodModule Decorator', () => {
  context('proxyFor', () => {
    let internalModel: any;
    let externalModel: any;
    let instance: any;
    let decorated;
    before('Configure proxy', () => {
      const app = loopback();
      internalModel = loopback.Model.extend(`Internal${Date.now()}`, {prop: 'string'}, {});
      externalModel =
          loopback.Model.extend(`External${Date.now()}`, {}, {idInjection: false, forceId: false});
      let memory = loopback.memory();
      internalModel.attachTo(memory);
      externalModel.attachTo(memory);
      app.model(internalModel);
      app.model(externalModel);

      @RemoteMethodModule({
        proxyFor: internalModel.modelName,
        proxyMethods: ['findById', 'prototype.updateAttributes']
      })
      class ModelClass {
        constructor(public model: any) {}
      }

      decorated = new ModelClass(externalModel);
      app.emit('booted');
    });

    before('Create instances', async () => {
      instance = await internalModel.create({prop: 'hello'});
    });

    it('proxies a static method to a target internal model', async () => {
      let loaded = await externalModel.findById(instance.id);
      expect(loaded).to.be.ok;
      expect(loaded).to.have.property('prop', 'hello');
      expect(loaded).to.be.instanceOf(internalModel);
    });

    it('proxies an instance method to a target internal model', async () => {
      // create an external model instance that will have the same id as the internal one
      let model = await externalModel.create();
      // save some changes which should trigger the save on the internal we proxy for
      let updated = await model.updateAttributes({prop: 'goodbye'});
      instance = await instance.reload();
      expect(instance).to.have.property('prop', 'goodbye');
    });
  });
});