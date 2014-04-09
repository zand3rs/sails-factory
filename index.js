var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var util = require("util");

var factories = {};

//==============================================================================

function Factory(name, modelName) {
  this.name = name;
  this.modelName = modelName || name;
  this.attrs = {};
  factories[this.name] = this;
}

//==============================================================================

Factory.prototype.attr = function(name, value) {
  this.attrs[name] = value;
  return this;
};

//------------------------------------------------------------------------------

Factory.prototype.parent = function(name) {
  var self = factories[this.name];
  var factory = factories[name];
  if (!factory) throw new Error("'" + name + "' is undefined.");

  return _.merge(self, factory);
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
  if (!factory) throw new Error("'" + name + "' is undefined.");

  var attributes = evalAttrs(_.merge(_.clone(factory.attrs), attrs));
  if (callback) callback(attributes);
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

  var factory = factories[name];
  if (!factory) throw new Error("'" + name + "' is undefined.");

  var attributes = evalAttrs(_.merge(_.clone(factory.attrs), attrs));
  var Model = sails.models[factory.modelName.toLowerCase()];

  Model.create(attributes).done(function(err, record) {
    if (err) throw new Error(util.inspect(err, {depth: null}));
    if (callback) callback(record);
  });
};

//------------------------------------------------------------------------------

Factory.load = function() {
  var args = Array.prototype.slice.call(arguments);
  var folder = path.join(process.cwd(), "test/factories");
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
};

//==============================================================================

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

  if (done) done(count);
}

//------------------------------------------------------------------------------

function requireFactory(module) {
  require(module)(Factory);
  return 1;
}

//------------------------------------------------------------------------------

function evalAttrs(attrs) {
  return _.reduce(attrs, function(result, val, key) {
           result[key] = (typeof val == "function") ? val() : val;
           return result;
         }, {});
}

//==============================================================================

module.exports = Factory;
