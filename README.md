sails-factory
=============

Sails Factory is a simple model factory for Sails.js. Inspired by [factory_girl](https://github.com/thoughtbot/factory_girl) and [rosie](https://github.com/bkeepers/rosie).

## Usage

### Defining factories

Define a factory by giving it a name and an optional model name. The factory name will be the default model name if model name is not provided.

    var Factory = require('sails-factory');

    Factory.define('user')
      .attr('first_name', 'First Name')
      .attr('last_name', 'Last Name')
      .attr('random_id', function() { return Math.random(); });

    Factory.define('active_user').parent('user')
      .attr('active', true);

    Factory.define('admin_user', 'Admin').parent('user');


### Using factories

    Factory.build('active_user', function(active_user) {
      // active_user: non-persistent 'active_user' instance
      // {
      //    first_name: 'First Name',
      //    last_name: 'Last Name',
      //    random_id: <number>,
      //    active: true
      // }
    });

    Factory.build('user', {first_name: 'Hello', last_name: function() { return 'World'; }}, function(user) {
      // user: non-persistent 'user' instance
      // {
      //    first_name: 'Hello',
      //    last_name: 'World',
      //    random_id: <number>
      // }
    });

    Factory.create('active_user', function(active_user) {
      // active_user: sails' User model instance
      // {
      //    id: <id>,
      //    first_name: 'First Name',
      //    last_name: 'Last Name',
      //    random_id: <number>,
      //    active: true,
      //    createdAt: <date>,
      //    updatedAt: <date>
      // }
    });

### Loading factories

Calling .load() without parameter will try to load factory defintions from test/factories folder. By default, the model name will be set to factory file name if not provided on define parameters.

    // api/models/User.js
    module.exports = {
      attributes: {
        first_name: 'string',
        last_name: 'string',
        random_id: 'integer',
        active: 'boolean'
      }
    };

    // test/factories/User.js
    module.exports = function(Factory) {
      Factory.define('user')
        .attr('first_name', 'First Name')
        .attr('last_name', 'Last Name')
        .attr('random_id', function() { return Math.random(); });

      Factory.define('active_user').parent('user')
        .attr('active', true);
    };

    // test/bootstrap.js
    before(function(done) {
      require('sails').lift({
        log: {
          level: 'error'
        }
      }, function(err, sails) {
        if (sails) {
          //-- load factory definition files from test/factories
          require('sails-factory').load();
        }
        done(err);
      });
    });

To load factory files from different folder:

    Factory.load("/path/to/factories");

To get the total number of loaded factory files:

    Factory.load(function(count) {
      // count is the total number of loaded files
    });
