'use strict'

const assert = require('chai').assert;
const exec = require('child_process').exec;
const del = require('del');
const fs = require('fs-extra');
const testProjName = 'aquiferTest';
const testCwd = '/tmp/';
const testPath = testCwd + testProjName;

describe('Aquifer create', function() {

  afterEach(function(done) {
    del([testProjName], { cwd: testCwd }, done);
  });
  
  it('should show a message that the project was created successfully', function(done) {
    const aquiferCreate = exec(`aquifer create ${testProjName}`, { 'cwd': testCwd },
      (error, stdout, stderr) => {
        assert.equal(stdout, `${testProjName} created successfully!\n`);
        done();
    });    
  });
});
