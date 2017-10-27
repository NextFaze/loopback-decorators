import { expect } from 'chai';
import { spy } from 'sinon';

import { ModelEvent } from '../';
import { createEventMethod } from '../lib/create-event';

describe('createEventMethod', () => {
  it('should bind to the class event listener', () => {
    const MockModel = mockModelFactory();
    const [meta] = Reflect.getMetadata('annotations', MockMethod);
    createEventMethod(MockModel, MockMethod, meta);
    expect(MockModel.on.calledWith('before save')).to.be.true;
  });

  it('resolve providers and call the event handler', async () => {
    const MockModel = mockModelFactory();
    const [meta] = Reflect.getMetadata('annotations', MockMethod);
    createEventMethod(MockModel, MockMethod, meta);
    const arg = 'some arg';
    await MockModel.handler('some arg');
    expect(providers[0].useFactory.called).to.be.true;
    expect(eventSpy.calledWith('some arg')).to.be.true;
  });
});

const providers: any[] = [
  { provide: 'DankDep', useFactory: spy(() => 'Dankness provided') },
];
const eventSpy = spy(() => {});
@ModelEvent({ selector: 'before save', providers })
class MockMethod {
  onEvent = eventSpy;
}

const mockModelFactory = () => {
  const mdl: any = {};
  mdl.on = spy((event: string, cb: Function) => (mdl.handler = cb));
  return mdl;
};
