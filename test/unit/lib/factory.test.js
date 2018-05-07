require("node-test-helper");

const async = require("async");
const path = require("upath");
const Self = require(path.join(process.cwd(), "lib", "factory"));

describe(TEST_NAME, function() {

  describe("constructor", function() {
    it("should return instance given a name and a model name", function() {
      const obj = new Self("sample", "sampleModel");
      expect(obj).to.be.an.instanceof(Self);
      expect(obj).to.have.property("name", "sample");
      expect(obj).to.have.property("modelName", "sampleModel");
      expect(obj).to.have.property("modelId", "samplemodel");
      expect(obj).to.have.property("attrs").that.is.an("object");
    });
    it("should transform modelName into a modelId format", function() {
      new Self("sample", "samplemodel").should.have.property("modelId", "samplemodel");
      new Self("sample", "sampleModel").should.have.property("modelId", "samplemodel");
      new Self("sample", "SampleModel").should.have.property("modelId", "samplemodel");
      new Self("sample", "sample_model").should.have.property("modelId", "samplemodel");
      new Self("sample", "sample-model").should.have.property("modelId", "samplemodel");
      new Self("sample", "sample model").should.have.property("modelId", "samplemodel");
    });
  });

  describe("#attr()", function() {
    it("should set attribute", function() {
      const attr_key = "foo";
      const attr_val = "bar";
      const obj = new Self("sample").attr(attr_key, attr_val);
      expect(obj.attrs).to.have.property(attr_key, attr_val);
    });
    it("could be chained", function() {
      const obj = new Self();
      expect(obj.attr("foo1", "bar1")).to.be.an.instanceof(Self);
      obj.attr("foo2", "bar2").attr("foo3", "bar3");
      expect(obj.attrs).to.have.property("foo1", "bar1");
      expect(obj.attrs).to.have.property("foo2", "bar2");
      expect(obj.attrs).to.have.property("foo3", "bar3");
    });
  });

  describe("#build()", function() {
    describe("with callback", function() {
      it("should return a promise instance", function(done) {
        const obj = new Self();
        const attrs = {"foo": "baz"};
        const res = obj.build(attrs, _.noop);

        expect(res).to.be.an.instanceof(Promise);
        res.then(_attrs => {
          expect(_attrs).eql(attrs);
          done();
        });
      });
      it("should execute the callback", function(done) {
        const spy = sinon.spy(function(attrs) {});
        const attrs = {"foo": "baz"};

        const obj = new Self();
        const res = obj.build(attrs, spy);
        expect(res).to.be.an.instanceof(Promise);
        expect(spy.calledOnce);
        expect(spy.firstCall.args[0]).eql(attrs);
        done();
      });
      xit("should return an object instance of a defined factory", function(done) {
        Self.build("sample", function(sample) {
          expect(sample).to.have.property("foo", "bar");
          expect(sample).to.have.property("hello", "ok");
          done();
        });
      });
      xit("should return an object instance of a defined factory with overridden attributes", function(done) {
        Self.build("sample", {"foo": "baz"}, function(sample) {
          expect(sample).to.have.property("foo", "baz");
          expect(sample).to.have.property("hello", "ok");
          done();
        });
      });
    });

    xdescribe("without callback", function() {
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

  xdescribe("#create()", function() {
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

  xdescribe("auto increment attributes", function() {
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
