import 'reflect-metadata';

import {expect} from 'chai';
import {spy} from 'sinon';
import {Validate} from '../';
import {validateArgs, validateMetadataKey} from '../lib/validate';
const ValidationError = require('loopback').ValidationError;

describe('@Validate', () => {
  it('should add metadata to the argument', () => {
    class Remote {
      onRemote(app: any, @Validate payload: string, @Validate other: any) {}
    }
    let meta = Reflect.getMetadata(validateMetadataKey, Remote, 'onRemote');
    expect(meta).to.have.eql([2, 1]);
  });
});

describe('validateArgs / getValid', () => {
  it('should call the validate each of the validatable args', async () => {
    const validatable = {isValid: spy((cb: Function) => cb(true))};
    class Remote {
      onRemote(app: any, @Validate payload: any = validatable) {}
    }
    await expect(validateArgs([{}, validatable], Remote)).to.eventually.be.ok;
    expect(validatable.isValid.calledOnce).to.be.true;
  });

  it('should throw a validation error if validation fails', async () => {
    const validatable = {
      errors: ['not dank enough'],
      isValid: spy((cb: Function) => cb(false)),
      toJSON: () => {}
    };
    class Remote {
      onRemote(app: any, @Validate payload: any = validatable) {}
    }
    await expect(validateArgs([{}, validatable], Remote))
        .to.eventually.be.rejectedWith(ValidationError);
    expect(validatable.isValid.calledOnce).to.be.true;
  });
})