/*
 *  This module is not a plain nodeunit test suite, but instead uses the
 *  assert module to ensure a basic level of functionality is present,
 *  allowing the rest of the tests to be written using nodeunit itself.
 */

var assert = require('assert'),
    nodeunit = require('nodeunit');


// NOT A TEST - util function to make testing faster.
// retries the assertion until it passes or the timeout is reached,
// at which point it throws the assertion error
var waitFor = function(fn, timeout, callback, start){
    start = start || new Date().getTime();
    callback = callback || function(){};
    try {
        fn();
        callback();
    }
    catch (e) {
        if(e instanceof assert.AssertionError){
            var now = new Date().getTime();
            if(now - start >= timeout){
                throw e;
                callback();
            }
            else {
                process.nextTick(function(){
                    waitFor(fn, timeout, callback, start);
                });
            }
        }
        else {
            throw e;
            callback();
        }
    }
};


// TESTS:

// Are exported tests actually run? - store completed tests in this variable
// for checking later
var tests_called = {};

// most basic test that should run, the tests_called object is tested
// at the end of this module to ensure the tests were actually run by nodeunit
exports.testCalled = function(test){
    tests_called['testCalled'] = true;
    test.done();
};

// generates test functions for nodeunit assertions
var makeTest = function(method, args_pass, args_fail){
    return function(test){
        var test1_called = false;
        var test2_called = false;

        // test pass
        nodeunit.runTest(
            function(test){
                test[method].apply(test, args_pass);
                test.done();
            },
            {testDone: function(name, assertions){
                assert.equal(assertions.length, 1);
                assert.equal(assertions.failures, 0);
                test1_called = true;
            }
        });

        // test failure
        nodeunit.runTest(
            function(test){
                test[method].apply(test, args_fail);
                test.done();
            },
            {testDone: function(name, assertions){
                assert.equal(assertions.length, 1);
                assert.equal(assertions.failures, 1);
                test2_called = true;
            }
        });

        // ensure tests were run
        waitFor(function(){
            assert.ok(test1_called);
            assert.ok(test2_called);
            tests_called[method] = true;
        }, 500, test.done);
    };
};

// ensure basic assertions are working:
exports.testOk = makeTest('ok', [true], [false]);
exports.testEquals = makeTest('equals', [1,1], [1,2]);
exports.testSame = makeTest('same',
    [{test:'test'},{test:'test'}],
    [{test:'test'},{monkey:'penguin'}]
);

exports.testExpect = function(test){
    var test1_called = false,
        test2_called = false,
        test3_called = false;

    // correct number of tests run
    nodeunit.runTest(
        function(test){
            test.expect(2);
            test.ok(true);
            test.ok(true);
            test.done();
        },
        {testDone: function(name, assertions){
            test.equals(assertions.length, 2);
            test.equals(assertions.failures, 0);
            test1_called = true;
        }
    });

    // no tests run
    nodeunit.runTest(
        function(test){
            test.expect(2);
            test.done();
        },
        {testDone: function(name, assertions){
            test.equals(assertions.length, 1);
            test.equals(assertions.failures, 1);
            test2_called = true;
        }
    });

    // incorrect number of tests run
    nodeunit.runTest(
        function(test){
            test.expect(2);
            test.ok(true);
            test.ok(true);
            test.ok(true);
            test.done();
        },
        {testDone: function(name, assertions){
            test.equals(assertions.length, 4);
            test.equals(assertions.failures, 1);
            test3_called = true;
        }
    });

    // ensure callbacks fired
    waitFor(function(){
        assert.ok(test1_called);
        assert.ok(test2_called);
        assert.ok(test3_called);
        tests_called['expect'] = true;
    }, 500, test.done);
};


// tests are async, so wait for them to be called
waitFor(function(){
    assert.ok(tests_called.testCalled);
    assert.ok(tests_called.ok);
    assert.ok(tests_called.equals);
    assert.ok(tests_called.same);
    assert.ok(tests_called.expect);
}, 2000);
