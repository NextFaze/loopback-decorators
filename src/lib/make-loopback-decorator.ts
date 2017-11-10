export function makeLoopbackDectorator(handler: (Model: any) => void) {
  return function ModelModuleConfigure(ctor: Function) {
    // save a reference to the original constructor
    const Original: any = ctor;
    // the new constructor behaviour
    let f: any = function (...args: any[]) {
      let Model = args[0];
      handler(Model);

      return new Original(...args);
    }

    f.prototype = Original.prototype;
    return f;
  }
}