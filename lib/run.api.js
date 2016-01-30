/**
 * @file
 * Contains the run API for Aquifer.
 */

'use strict';

/**
 * Constructs run API for Aquifer.
 *
 * @class
 * @classdesc Contains run API for Aquifer.
 */
class Run {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer Current instance of Aquifer.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer) {
    this.aquifer = Aquifer;
  }


  setEnvironment() {

  }

  execute() {
    return new Promise((resolve, reject) => {

    })
  }
}

let shell = Run(Aquifer);

Promise.all([
  shell.execute('drush', ['cc', 'all']),
  shell.execute('drush', ['rr']),
  shell.execute('drush', ['fra', '-y']),
])
.catch((reason) => {
  Aquifer.console.log(reason, 'error')
});

