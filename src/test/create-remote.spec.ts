import {expect} from 'chai';
import {spy} from 'sinon';

import {createRemoteMethod} from '../lib/create-remote';

describe('createRemoteMethod', () => {
  it('should handle a static method', () => {
    const mockClass = mockClassFactory();
    let props = mockProps();
    props.meta.isStatic = true;
    createRemoteMethod(mockClass, {}, props);
    expect(mockClass).to.have.property('meth').and.to.be.a('function');
  });

  it('should handle an instance method', () => {
    const mockClass = mockClassFactory();
    let props = mockProps();
    createRemoteMethod(mockClass, {}, props);
    expect(mockClass.prototype).to.have.property('meth').and.to.be.a('function');
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
        expect(arg).to.eql('Dankness provided', 'should be provided the dependency');
      }
      public onRemote = remoteSpy;
    }
    createRemoteMethod(mockClass, remote, props);
    let res = await(<any>mockClass).prototype.meth.call({}, 'dank');
    expect(remoteSpy.calledWith('dank')).to.be.true;
    expect(res).to.eql('output');
  });
});

const mockClassFactory = () => ({prototype: {}, remoteMethod: spy(() => true)});

const providers: any = [{provide: 'DankDep', useFactory: () => 'Dankness provided'}];
const mockProps = () => ({selector: 'meth', meta: {isStatic: false}, providers});
