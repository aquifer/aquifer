'use strict'

const assert = require('chai').assert;
const Console = require('../../lib/console.api');

describe('Console', function() {
  describe('#log()', function() {
    it('should show a notice if an improper log type is passed to it.', function() {
      let reg = /\(NOTE/;
      let console = new Console({});
      console.log('This is a message', 'fake', false).then(function(msg) {
        assert.typeOf(msg, 'string');
        assert.match(msg, reg);
      });
    });
  });
});
