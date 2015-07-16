var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var util = require("util");
var inflection = require("inflection");

var factories = {};

//==============================================================================
//-- export module

module.exports = Factory;

//==============================================================================
//-- constructor

function Factory(name, modelName) {
  this.name = name;
  this.modelName = modelName || name;
  this.usingDefaultModel = (!modelName) ? true : false;
  this.seqs = {};
  this.attrs = {};

  factories[this.name] = this;
}

//==============================================================================
//-- instance

Factory.prototype.attr = function(name, value, options) {
  var self = this;

  self.seqs[name] = parseInt(value) || 0;
  self.attrs[name] = value;

  var opts = filterOptions(options);
  if (opts.auto_increment) {
    self.attrs[name] = function() {
      self.seqs[name] += opts.auto_increment;
      return ((_.isFunction(value)) ? value() : value) + self.seqs[name];
    }
  }

  return this;
};

//------------------------------------------------------------------------------

Factory.prototype.parent = function(name) {
  var factory = factories[name];
  if (!factory) {
    throw new Error("Factory '" + name + "' is undefined.");
  }

  //-- use parent model if model was not given...
  if (this.usingDefaultModel) {
    this.modelName = factory.modelName;
  }
  _.merge(this.seqs, _.clone(factory.seqs, true));
  _.merge(this.attrs, _.clone(factory.attrs, true));

  return this;
};

//==============================================================================
//-- static

Factory.define = function(name, modelName) {
  var caller = arguments.callee.caller.caller;
  var caller_args = caller.arguments;

  if (!modelName && caller === requireFactory) {
    var filename = caller_args[0];
    modelName = path.basename(filename, ".js");
  }

  var factory = new Factory(name, modelName);
  return factory;
};

//------------------------------------------------------------------------------

Factory.build = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  var attrs = {};
  var callback = null;

  while (arg = args.shift()) {
    switch (typeof arg) {
      case "object":
        attrs = arg;
        break;
      case "function":
        callback = arg;
        break;
    }
  }

  var factory = factories[name];
  if (!factory) {
    throw new Error("Factory '" + name + "' is undefined.");
  }

  var attributes = evalAttrs(_.merge(_.clone(factory.attrs, true), attrs));
  callback && callback(attributes);

  return attributes;
};

//------------------------------------------------------------------------------

Factory.create = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  var attrs = {};
  var callback = null;

  while (arg = args.shift()) {
    switch (typeof arg) {
      case "object":
        attrs = arg;
        break;
      case "function":
        callback = arg;
        break;
    }
  }

  //-- check if sails is up...
  if (!sails) {
    throw new Error("Sails is not available.");
  }

  var factory = factories[name];
  if (!factory) {
    throw new Error("Factory '" + name + "' is undefined.");
  }

  var attributes = evalAttrs(_.merge(_.clone(factory.attrs, true), attrs));
  var modelId = inflection.camelize(factory.modelName).toLowerCase();
  var Model = sails.models[modelId];
  if (!Model) {
    throw new Error("Sails model '" + modelId + "' is undefined.");
  }

  Model.create(attributes).exec(function(err, record) {
    if (err) {
      throw new Error(util.inspect(err, {depth: null}));
    }
    callback && callback(record);
  });
};

//------------------------------------------------------------------------------

Factory.load = function() {
  var args = Array.prototype.slice.call(arguments);
  var folder = path.join(process.cwd(), "test", "factories");
  var callback = null;

  while (arg = args.shift()) {
    switch (typeof arg) {
      case "string":
        folder = arg;
        break;
      case "function":
        callback = arg;
        break;
    }
  }

  //-- load all factories
  requireAll(folder, callback);
  return this;
};

//==============================================================================
//-- private

function requireAll(folder, done) {
  var files = fs.readdirSync(folder);
  var count = 0;

  files.forEach(function(file) {
    var filepath = path.join(folder, file);
    if (fs.statSync(filepath).isDirectory()) {
      requireAll(filepath, function(cnt) { count += cnt });
    } else {
      if (file.match(/(.+)\.js$/)) {
        count += requireFactory(filepath);
      }
    }
  });

  done && done(count);
}

//------------------------------------------------------------------------------

function requireFactory(module) {
  require(module)(Factory);
  return 1;
}

//------------------------------------------------------------------------------

function filterOptions(options) {
  var opts = {};

  if (!_.isObject(options)) {
    return opts;
  }
  if (options.auto_increment) {
    opts.auto_increment = (_.isNumber(options.auto_increment) && options.auto_increment > 0)
                        ? Math.floor(options.auto_increment)
                        : 1;
  }
  return opts;
}

//------------------------------------------------------------------------------

function evalAttrs(attrs) {
  return _.reduce(attrs, function(result, val, key) {
           result[key] = (_.isFunction(val)) ? val() : val;
           return result;
         }, {});
}

//==============================================================================
