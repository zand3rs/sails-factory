/**
 * SailsFactory
 *
 */

const _ = require("lodash");
const fs = require("fs");
const path = require("upath");
const Factory = require(path.normalizeSafe("./lib/factory"));

const factoryMap = new Map();

//==============================================================================

class SailsFactory {

  constructor(fpath = "") {
    const modelName = path.trimExt(path.basename(fpath));

    Object.defineProperties(this, {
      modelName: { value: modelName }
    });

    //-- load factory
    if (fpath) {
      require(fpath)(this);
    }
  }

  //----------------------------------------------------------------------------

  load(...args) {
    let folder = "test/factories";
    let callback = null;

    _(args).each((arg) => {
      _.isString(arg) && (folder = arg);
      _.isFunction(arg) && (callback = arg);
    });

    const dir = path.resolve(folder);
    const files = fs.readdirSync(dir);
    let count = 0;

    _.forEach(files, (fname) => {
      const fpath = path.join(dir, fname);

      if (/^[^.].*\.js$/.test(fname) && fs.statSync(fpath).isFile()) {
        new SailsFactory(fpath) && ++count;
      }
    });

    callback && callback(count);
  }

  //----------------------------------------------------------------------------

  define(name, modelName) {
    const factory = new Factory(name, (modelName || this.modelName || name));

    factoryMap.set(name, factory);
    return factory;
  }

  //----------------------------------------------------------------------------

  build(name, ...args) {
    let attrs = {};
    let callback = null;

    _(args).each((arg) => {
      _.isPlainObject(arg) && (attrs = arg);
      _.isFunction(arg) && (callback = arg);
    });

    const factory = factoryMap.get(name);
    if (!factory) {
      throw new Error("Factory '" + name + "' is undefined.");
    }

    return factory.build(attrs, callback);
  }

  //----------------------------------------------------------------------------

  create(name, ...args) {
    let attrs = {};
    let callback = null;

    _(args).each((arg) => {
      _.isPlainObject(arg) && (attrs = arg);
      _.isFunction(arg) && (callback = arg);
    });

    const factory = factoryMap.get(name);
    if (!factory) {
      throw new Error("Factory '" + name + "' is undefined.");
    }

    return factory.create(attrs, callback);
  }

}

//==============================================================================
//-- export

module.exports = new SailsFactory();

//==============================================================================
