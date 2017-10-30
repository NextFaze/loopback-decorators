import { expect } from 'chai';
import { spy } from 'sinon';

const loopback = require('loopback');
import { createRemoteMethod } from '../lib/create-remote';
import { Response, Validate } from '../index';

describe('createRemoteMethod', () => {
  it('should handle a static method', () => {
    const mockClass = mockClassFactory();
    let props = mockProps();
    props.meta.isStatic = true;
    createRemoteMethod(mockClass, {}, props);
    expect(mockClass)
      .to.have.property('meth')
      .and.to.be.a('function');
  });

  it('should handle an instance method', () => {
    const mockClass = mockClassFactory();
    let props = mockProps();
    createRemoteMethod(mockClass, {}, props);
    expect(mockClass.prototype)
      .to.have.property('meth')
      .and.to.be.a('function');
  });

  it('should bind the remote method to the model', () => {
    const mockClass = mockClassFactory();
    let props = mockProps();
    createRemoteMethod(mockClass, {}, props);
    expect(mockClass.remoteMethod.calledWith('meth', props.meta)).to.be.true;
  });

  it('should call the remote handler', async () => {
    const mockClass = mockClassFactory();
    const props = mockProps();
    const remoteSpy = spy(() => 'output');
    class remote {
      constructor(arg: any) {
        expect(arg).to.eql(
          'Dankness provided',
          'should be provided the dependency'
        );
      }
      public onRemote = remoteSpy;
    }
    createRemoteMethod(mockClass, remote, props);
    let res = await (<any>mockClass).prototype.meth.call({}, 'dank');
    expect(remoteSpy.calledWith('dank')).to.be.true;
    expect(res).to.eql('output');
  });

  it('should map the response to a response class if it exists', async () => {
    const mockClass = mockClassFactory();
    class remote {
      constructor(arg: any) {
        expect(arg).to.eql(
          'Dankness provided',
          'should be provided the dependency'
        );
      }

      @Response({ responseClass: 'User' })
      onRemote() {
        return {
          username: 'Biff Tannen',
        };
      }
    }
    createRemoteMethod(mockClass, remote, mockProps());
    let res = await (<any>mockClass).prototype.meth.call({}, null);
    expect(res).to.be.instanceof(loopback.User);
  });

  it('should validate any args marked as validatable', async () => {
    const mockClass = mockClassFactory();
    const remoteSpy = spy();
    class remote {
      constructor(arg: any) {
        expect(arg).to.eql(
          'Dankness provided',
          'should be provided the dependency'
        );
      }

      onRemote(@Validate user: any) {
        remoteSpy();
      }
    }
    loopback.User.attachTo(loopback.memory());
    createRemoteMethod(mockClass, remote, mockProps());
    let res = await expect(
      (<any>mockClass).prototype.meth.call(
        {},
        new loopback.User({
          email: 'not-an-email',
        })
      )
    ).to.eventually.be.rejectedWith(loopback.ValidationError);
  });
});

const mockClassFactory = () => ({
  prototype: {},
  remoteMethod: spy(() => true),
});

const providers: any = [
  { provide: 'DankDep', useFactory: () => 'Dankness provided' },
];
const mockProps = () => ({
  selector: 'meth',
  meta: { isStatic: false },
  providers,
});
