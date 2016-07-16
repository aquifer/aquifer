'use strict'

const assert = require('chai').assert;
const Console = require('../../lib/console.api');

describe('Console', function() {
  describe('#log()', function() {
    it('should show a notice if an improper log type is passed to it.', function() {
      let reg = /\(NOTE/;
      let console = new Console({});
      let msg = console.log('This is a message', 'fake', false);
      assert.typeOf(msg, 'string');
      assert.match(msg, reg);
    });
  });
});
