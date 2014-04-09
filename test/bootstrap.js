/*
 * Sails application launcher.
 *
 */

//==============================================================================

before(function(done) {
  require("sails").lift({
    log: {
      level: "silent"
    },
    paths: {
      models: require("path").join(process.cwd(), "test/fixtures/models")
    },
    adapters: {
      default: "sails-memory"
    },
    session: {
      secret: "s.e.c.r.e.t"
    }
  }, function(err, sails) {
    done(err);
  });
});

//------------------------------------------------------------------------------

after(function(done) {
  (typeof sails != "undefined") ? sails.lower(done) : done();
});
