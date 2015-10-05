```
                    _  __
   __ _  __ _ _   _(_)/ _| ___ _ __
  / _` |/ _` | | | | | |_ / _ \ '__|
 | (_| | (_| | |_| | |  _|  __/ |
  \__,_|\__, |\__,_|_|_|  \___|_|
           |_|

```
Aquifer is a command line interface that makes it easy to scaffold, build, test, and deploy your Drupal websites. It provides a default set of tools that allow you to develop, and build Drupal sites using the Drush-make workflow. In addition, Aquifer ships with an extensions system that allows you to add additional tools to your project.


## Installation
Aquifer is an npm module, installing it is relatively painless:

* Ensure that node.js and npm are installed. We recommend using [nvm](https://github.com/creationix/nvm) to do this.
* In your command line, run: `npm install -g aquifer`

Aquifer should now be installed!

## Use
Aquifer has some helpful command line documentation. Run `aquifer --help` to get a list of the commands that are availble to you at any given time. If you need documentation for a specific command, run `aquifer commandName --help`.

If you need more in-depth documentation, checkout these wiki documents:
1. [What is Aquifer?](/aquifer/aquifer/wiki/What-is-Aquifer%3F)
2. [Installing Aquifer](/aquifer/aquifer/wiki/Installing-Aquifer)
3. [Creating Aquifer Projects](/aquifer/aquifer/wiki/Creating-Aquifer-Projects)
4. [Aquifer project directories](/aquifer/aquifer/wiki/Aquifer-project-directories)
5. [Building a Drupal site root](/aquifer/aquifer/wiki/Building-a-Drupal-site-root)
6. [Installing/refreshing a Drupal site](/aquifer/aquifer/wiki/Installing-refreshing-a-Drupal-site)
7. [Adding, removing, loading, and listing extensions](/aquifer/aquifer/wiki/Adding,-removing,-loading,-and-listing-extensions)

## Quick-start guide
You can easily get started using Aquifer with just a couple commands.

### 1. Create an Aquifer project
To create an Aquifer-based Drupal project, run the following command:

```bash
aquifer create mySiteName
```

The `mySiteName` directory will now contain an Aquifer project with an number of files/folders. For information on what each file and folder is, checkout [this document in the wiki](https://github.com/aquifer/aquifer/wiki/Aquifer-project-directories).

### 2. Building a Drupal site
Aquifer projects build into a Drupal site root in the `build` directory. To build the Drupal site, run:

```bash
aquifer build
```

This command will use Drush make and other tools to construct a Drupal site root, which will now be located in the `build` folder, or whatever folder is specified in `aquifer.json` in the `build` property.

