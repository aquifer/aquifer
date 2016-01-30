![Aquifer](https://raw.githubusercontent.com/aquifer/aquifer.io/master/branding/aquifer-logo-drupal-1456.png)

Aquifer is a command line interface that makes it easy to scaffold, build, test, and deploy your Drupal websites. It provides a default set of tools that allow you to develop, and build Drupal sites using the Drush-make workflow. In addition, Aquifer ships with an extensions system that allows you to add additional tools to your project.


## Installation

Aquifer is an npm module, installing it is relatively painless:

* Ensure that node.js and npm are installed. We recommend using [nvm](https://github.com/creationix/nvm) to do this.
* Install [Drush](http://www.drush.org/en/master/install/). Aquifer is compatible with Drush 7.x and 6.x.
* In your command line, run the following based on your environment:

Linux:
`sudo npm install -g aquifer npmdoctor`
`sudo npmdoctor -u $(whoami)`

Mac OS X:
`brew npm install -g aquifer`
`brew npmdoctor -u $(whoami)`

Aquifer should now be installed!

## Use

Aquifer has some helpful command line documentation. Run `aquifer --help` to get a list of the commands that are availble to you at any given time. If you need documentation for a specific command, run `aquifer commandName --help`.

If you need more in-depth documentation, checkout these wiki documents:
* [What is Aquifer?](https://github.com/aquifer/aquifer/wiki/What-is-Aquifer%3F)
* [Installing Aquifer](https://github.com/aquifer/aquifer/wiki/Installing-Aquifer)
* [Creating Aquifer Projects](https://github.com/aquifer/aquifer/wiki/Creating-Aquifer-Projects)
* [Aquifer project directories](https://github.com/aquifer/aquifer/wiki/Aquifer-project-directories)
* [Building a Drupal site root](https://github.com/aquifer/aquifer/wiki/Building-a-Drupal-site-root)
* [Installing/refreshing a Drupal site](https://github.com/aquifer/aquifer/wiki/Installing-refreshing-a-Drupal-site)
* [Adding, removing, loading, and listing extensions](https://github.com/aquifer/aquifer/wiki/Adding,-removing,-loading,-and-listing-extensions)

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

### 3. Adding contrib modules

To add contrib modules to your project, simply edit the `drupal.make.yml` file and add your contrib modules there. To learn more about Drush Make, see http://www.drush.org/en/master/make/

Aquifer makes optional use of Drush make lock files. If you make a change to `drupal.make.yml` after you've already built your site, you'll need to add the `--refresh-lock` flag to the `aquifer build` command so that the lock file is recalculated when your site root is constructed.

For more details, visit the [documentation page](https://github.com/aquifer/aquifer/wiki/Building-a-Drupal-site-root) for the build system.

### 4. Adding custom code

Custom themes should be added to the `themes` folder within the Aquifer root, and likewise custom modules should be added to the `modules/custom` folder, or `modules/features` folder if the custom module is a feature. When you build the site, Aquifer will symlink those files into your site root.

## Useful extensions

Several extensions for Aquifer already exist, and you may find them useful:

* [Aquifer Git](https://github.com/aquifer/aquifer-git) - Deploy Aquifer builds to a git repository (like Pantheon or Acquia).
* [Aquifer Coder](https://github.com/aquifer/aquifer-coder) - Coding standards sniffing and linting utility.
* [Aquifer Drush](https://github.com/aquifer/aquifer-drush) - Drush wrapper for Aquifer.
* [Aquifer Artifact](https://github.com/aquifer/aquifer-artifact) - Aquifer extension for creating artifacts for deployment.

## Contributing

Use the project, fork it, and submit PRs. We are responsive and will review them as soon as possible!

## Special thanks to...

These humanoids (in alphabetical order) are responsible for creating and maintaining Aquifer:

* [Jeff Tomlinson](https://github.com/JeffTomlinson)
* [Jon Peck](https://github.com/fluxsauce)
* [Matt Grill](https://github.com/mattgrill)
* [Patrick Coffey](https://github.com/patrickocoffeyo)
* [Peter Sieg](https://github.com/chasingmaxwell)

## Credits and usage

**Aquifer** is a trademark of Four Kitchens, LLC. You are free to use the logo to promote the Aquifer product as long as you do not modify it in any way.

Drupal is a [registered trademark](http://drupal.com/trademark) of [Dries Buytaert](http://buytaert.net/).
