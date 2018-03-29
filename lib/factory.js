/**
 * Factory
 *
 */

const _ = require("lodash");
const path = require("upath");
const util = require("util");

//==============================================================================

class Factory {

  constructor(name, modelName) {
    const modelId = _.camelCase(modelName).toLowerCase();
    const attrs = {};

    Object.defineProperties(this, {
      name: { value: name },
      modelName: { value: modelName },
      modelId: { value: modelId },
      attrs: { value: attrs }
    });
  }

  //----------------------------------------------------------------------------

  attr(name, value, options) {
    _.set(this.attrs, name, value);
    return this;
  }

  //----------------------------------------------------------------------------

  build(attrs, callback) {
    const _attrs = _.merge({}, this.attrs, attrs);
    const promise = new Promise((resolve, reject) => {
      resolve(_attrs);
    });

    if (_.isFunction(callback)) {
      if (callback.length > 1) {
        callback(null, _attrs);
      } else {
        callback(_attrs);
      }
    }

    return promise;
  }

  //----------------------------------------------------------------------------

  create(attrs, callback) {
    //-- check if sails is up...
    if (typeof sails === "undefined") {
      throw new Error("Sails is not available.");
    }

    const Model = _.get(sails.models, this.modelId);
    if (!Model) {
      throw new Error("Sails model '" + this.modelId + "' is undefined.");
    }

    const _attrs = _.merge({}, this.attrs, attrs);
    const query = Model.create(_attrs);

    if (_.isFunction(callback)) {
      if (callback.length > 1) {
        query.exec(callback);
      } else {
        query.exec((err, record) => {
          if (err) {
            throw new Error(util.inspect(err, {depth: null}));
          }
          callback(record);
        });
      }
    }

    return query;
  }

}

//==============================================================================
//-- export

module.exports = Factory;

//==============================================================================
