sails-factory
=============

Sails Factory is a simple model factory for Sails.js. Inspired by [factory_girl](https://github.com/thoughtbot/factory_girl) and [rosie](https://github.com/bkeepers/rosie).

## Installation
    
    npm install sails-factory

## Usage

### Defining factories

Define a factory by giving it a name and an optional model name. The factory name will be the default model name if model name is not provided.

    var factory = require("sails-factory");

    factory.define("user")
      .attr("first_name", "First Name")
      .attr("last_name", "Last Name")
      .attr("random_id", function() { return Math.random(); });

    factory.define("active_user").parent("user")
      .attr("active", true);

    factory.define("admin_user", "Admin").parent("user");

### Using factories

    factory.build("active_user", function(active_user) {
      // active_user: non-persistent "active_user" instance
      // {
      //    first_name: "First Name",
      //    last_name: "Last Name",
      //    random_id: <number>,
      //    active: true
      // }
    });

    factory.build("user", {first_name: "Hello", last_name: function() { return "World"; }}, function(user) {
      // user: non-persistent "user" instance
      // {
      //    first_name: "Hello",
      //    last_name: "World",
      //    random_id: <number>
      // }
    });

    factory.create("active_user", function(active_user) {
      // active_user: sails User model instance
      // {
      //    id: <id>,
      //    first_name: "First Name",
      //    last_name: "Last Name",
      //    random_id: <number>,
      //    active: true,
      //    createdAt: <date>,
      //    updatedAt: <date>
      // }
    });

### Auto increment attributes

Attributes can have an auto_increment option. By default, sequence will increment by 1, otherwise it will increment by whatever value the auto_increment option is set to. Counting starts at the initial value given. Sequence is shared among parent and children.

    factory.define("user")
      .attr("id", 0, {auto_increment: true})
      .attr("first_name", "First Name - ", {auto_increment: 5});

    factory.define("other_user").parent("user");

    factory.build("user", function(user) {
      // user:
      // {
      //    id: 1,
      //    first_name: "First Name - 5",
      //    ...
      // }
    });

    factory.create("user", function(user) {
      // user:
      // {
      //    id: 2,
      //    first_name: "First Name - 10",
      //    ...
      // }
    });

    factory.build("other_user", function(other_user) {
      // other_user:
      // {
      //    id: 3,
      //    first_name: "First Name - 15",
      //    ...
      // }
    });

### Loading factories

Calling .load() without parameter will try to load factory definitions from test/factories folder. By default, the model name will be set to factory file name if not provided on define parameters.

    // api/models/User.js
    module.exports = {
      attributes: {
        first_name: "string",
        last_name: "string",
        random_id: "integer",
        active: "boolean"
      }
    };

    // test/factories/User.js
    module.exports = function(factory) {
      factory.define("user")
        .attr("first_name", "First Name")
        .attr("last_name", "Last Name")
        .attr("random_id", function() { return Math.random(); });

      factory.define("active_user").parent("user")
        .attr("active", true);
    };

    // test/bootstrap.js
    before(function(done) {
      require("sails").lift({
        log: {
          level: "error"
        }
      }, function(err, sails) {
        if (sails) {
          //-- load factory definition files from test/factories
          require("sails-factory").load();
        }
        done(err);
      });
    });

To load factory files from different folder:

    factory.load("/path/to/factories");

To get the total number of loaded factory files:

    factory.load(function(count) {
      // count is the total number of loaded files
    });
