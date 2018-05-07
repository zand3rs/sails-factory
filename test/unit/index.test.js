require("node-test-helper");

const async = require("async");
const path = require("upath");
const Self = require(process.cwd());

describe(TEST_NAME, function() {

  describe("constructor", function() {
    it("should return factory instance given a name", function() {
      var obj = new Self("sample");
      expect(obj).to.be.an.instanceof(Self);
      expect(obj.name).to.equal("sample");
      expect(obj.modelName).to.equal(obj.name);
    });
    it("should return factory instance given a name and modelName", function() {
      var obj = new Self("sample", "sampleModel");
      expect(obj).to.be.an.instanceof(Self);
      expect(obj.name).to.equal("sample");
      expect(obj.modelName).to.equal("sampleModel");
    });
  });

  describe("#attr()", function() {
    it("should set factory attribute", function() {
      var attr_key = "foo";
      var attr_val = "bar";
      var obj = new Self("sample").attr(attr_key, attr_val);
      expect(obj.attrs).to.have.property(attr_key, attr_val);
    });
  });

  describe("#parent()", function() {
    it("should copy attributes from parent factory", function() {
      var attr_key = "foo";
      var attr_val = "bar";
      var obj = new Self("sample").attr(attr_key, attr_val);
      expect(obj.attrs).to.have.property(attr_key, attr_val);

      var childObj = new Self("child").parent("sample");
      expect(childObj.attrs).to.have.property(attr_key, attr_val);
    });
  });

  describe(".define()", function() {
    it("should return factory obj given a name", function() {
      var obj = Self.define("sample");
      expect(obj).to.be.an.instanceof(Self);
      expect(obj.name).to.equal("sample");
      expect(obj.modelName).to.equal(obj.name);
    });
    it("should return factory obj given a name and modelName", function() {
      var obj = Self.define("sample", "sampleModel");
      expect(obj).to.be.an.instanceof(Self);
      expect(obj.name).to.equal("sample");
      expect(obj.modelName).to.equal("sampleModel");
    });
  });

  describe(".build()", function() {
    before(function() {
      Self.define("sample")
        .attr("foo", "bar")
        .attr("hello", function() { return "ok"; });
    });

    describe("with callback", function() {
      it("should return an object instance of a defined factory", function(done) {
        Self.build("sample", function(sample) {
          expect(sample).to.have.property("foo", "bar");
          expect(sample).to.have.property("hello", "ok");
          done();
        });
      });
      it("should return an object instance of a defined factory with overridden attributes", function(done) {
        Self.build("sample", {"foo": "baz"}, function(sample) {
          expect(sample).to.have.property("foo", "baz");
          expect(sample).to.have.property("hello", "ok");
          done();
        });
      });
    });

    describe("without callback", function() {
      it("should return an object instance of a defined factory", function() {
        var sample = Self.build("sample");
        expect(sample).to.have.property("foo", "bar");
        expect(sample).to.have.property("hello", "ok");
      });
      it("should return an object instance of a defined factory with overridden attributes", function() {
        var sample = Self.build("sample", {"foo": "baz"});
        expect(sample).to.have.property("foo", "baz");
        expect(sample).to.have.property("hello", "ok");
      });
    });
  });

  describe(".create()", function() {
    before(function() {
      Self.define("sample")
        .attr("title", "my title")
        .attr("description", "my description");
    });

    it("should return a model instance of a defined factory", function(done) {
      Self.create("sample", function(sample) {
        expect(sample).to.have.property("id");
        expect(sample).to.have.property("title", "my title");
        expect(sample).to.have.property("description", "my description");
        done();
      });
    });
    it("should return a model instance of a defined factory with overridden attributes", function(done) {
      Self.create("sample", {title: "hello"}, function(sample) {
        expect(sample).to.have.property("id");
        expect(sample).to.have.property("title", "hello");
        expect(sample).to.have.property("description", "my description");
        done();
      });
    });
  });

  describe(".load()", function() {
    it("should load all factory definition files from default folder", function(done) {
      Self.load(function(count) {
        expect(count).to.equal(1);
        done();
      });
    });
    it("should load all factory definition files from the given folder", function(done) {
      var factoryPath = path.join(process.cwd(), "test", "factories", "sample2");
      Self.load(factoryPath, function(count) {
        expect(count).to.equal(2);
        done();
      });
    });
  });

  describe("auto increment attributes", function() {
    before(function() {
      Self.define("sample")
        .attr("id", 0, {auto_increment: true})
        .attr("title", "title-%d", {auto_increment: 2})
        .attr("description", "using sequence");

      Self.define("sample2").parent("sample");
    });

    it("should be shared among children", function(done) {
      async.series([
        function(done) {
          Self.build("sample", function(sample) {
            expect(sample).to.have.property("id", 1);
            expect(sample).to.have.property("title", "title-2");
            done();
          });
        },
        function(done) {
          Self.build("sample", function(sample) {
            expect(sample).to.have.property("id", 2);
            expect(sample).to.have.property("title", "title-4");
            done();
          });
        },
        function(done) {
          Self.create("sample", function(sample) {
            expect(sample).to.have.property("id", 3);
            expect(sample).to.have.property("title", "title-6");
            done();
          });
        },
        function(done) {
          Self.build("sample2", function(sample) {
            expect(sample).to.have.property("id", 4);
            expect(sample).to.have.property("title", "title-8");
            done();
          });
        },
        function(done) {
          Self.build("sample2", function(sample) {
            expect(sample).to.have.property("id", 5);
            expect(sample).to.have.property("title", "title-10");
            done();
          });
        },
        function(done) {
          Self.create("sample2", function(sample) {
            expect(sample).to.have.property("id", 6);
            expect(sample).to.have.property("title", "title-12");
            done();
          });
        }
      ], function(err) {
        done(err);
      });
    });

    it("can be overridden", function(done) {
      async.series([
        function(done) {
          Self.build("sample", {id: 99}, function(sample) {
            expect(sample).to.have.property("id", 99);
            done();
          });
        },
        function(done) {
          Self.create("sample", {id: 999}, function(sample) {
            expect(sample).to.have.property("id", 999);
            done();
          });
        },
        function(done) {
          Self.build("sample2", {id: 88}, function(sample) {
            expect(sample).to.have.property("id", 88);
            done();
          });
        },
        function(done) {
          Self.create("sample2", {id: 888}, function(sample) {
            expect(sample).to.have.property("id", 888);
            done();
          });
        }
      ], function(err) {
        done(err);
      });
    });
  });

});
