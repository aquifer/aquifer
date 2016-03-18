/**
 * @file
 * Defines 'aquifer run' cli.
 */

'use strict';

/**
 * Defines the 'run' command
 * @param {object} Aquifer active instance of Aquifer.
 * @returns {undefined} nothing.
 */
module.exports = function (Aquifer) {

  // Define the 'run' command.
  Aquifer.cli.command('run [name]')
  .description('Invoke a command or set of commands defined in aquifer.json.')
  .option('-c --command <command>', 'A manually specified command to invoke.')
  .action((name, options) => {
    let scripts = Aquifer.project.config.run.scripts;
    let spawnOpts = Aquifer.project.config.run.options || {};
    let run = new Aquifer.api.run(Aquifer);
    let method;
    let script;

    // Set cwd parameter.
    spawnOpts.cwd = Aquifer.project.config.paths.build;

    if (name) {
      if (!scripts.hasOwnProperty(name)) {
        Aquifer.console.log('The ' + name + ' script does not exist.', 'error');
        return;
      }

      // Use named script in config.
      script = scripts[name];
    }
    else if (options.hasOwnProperty('command')) {
      // Use manually entered command.
      script = options.command;
      name = 'Manually entered';
    }
    else {
      Aquifer.console.log('No valid script or command specified.', 'error');
      return;
    }

    // Determine the method for handling the script.
    switch (script.constructor) {
      case Array:
        method = 'invokeAll';
        break;
      case String:
        method = 'invoke';
        break;
      default:
        Aquifer.console.log('The ' + name + ' is not an array or string.', 'error');
        return;
    }

    run[method](script, {})
    .then(() => {
      Aquifer.console.log(name + ' script completed!', 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    })
  })
}
