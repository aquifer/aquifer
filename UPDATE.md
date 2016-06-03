## [2016-06-02] Run `composer install` inside build directory

Performs Composer build by copying `composer.json`, `composer.lock`, and `/scripts/composer` into the build directory and runs `composer install` from withing the build directory.

This makes `aquifer build` using composer more flexible and able to work with alternative build directories such as those creates bu `aquifer-git`.

This will break projects that have the build directory prepended to their `vendor-dir` and `installer-paths` settings in `composer.json`. Those settings should be reconfigured to be relative to the project build directory.

You will also need to add the add a `build.scriptsDir` property to your `aquifer.json` file:

```
"build": {
  "method": "composer",
  "directory": "build",
  "makeFile": "composer.json",
  "scriptsDir": "scripts/composer"
}
```

## [2016-05-17] New aquifer.json directory configuration

The configuration for Drupal directories in `aquifer.json` has changed.

The new default configuration looks something like this:

```
{
  "name": false,
  "core": 8,
  "build": {
    "method": "drush make",
    "directory": "build",
    "makeFile": "drupal.make.yml"
  },
  "sync": {
    "directories": {
      "root": {
        "destination": "",
        "method": "symlink",
        "conflict": "overwrite"
      },
      "modules/custom": {
        "destination": "modules/custom",
        "method": "symlink",
        "conflict": "overwrite"
      },
      "themes/custom": {
        "destination": "themes/custom",
        "method": "symlink",
        "conflict": "overwrite"
      },
      "files": {
        "destination": "sites/default/files",
        "method": "symlink",
        "conflict": "overwrite"
      }
    },
    "files": {
      "settings/settings.php": {
        "destination": "sites/default/settings.php",
        "method": "symlink",
        "conflict": "overwrite"
      },
      "settings/secret.settings.php": {
        "destination": "sites/default/secret.settings.php",
        "method": "symlink",
        "conflict": "overwrite"
      },
      "settings/local.settings.php": {
        "destination": "sites/default/local.settings.php",
        "method": "symlink",
        "conflict": "overwrite"
      }
    }
  },
  "run": {
    "scripts": {
      "refresh": [
        "drush updb -y",
        "drush cr -y"
      ]
    }
  },
  "extensions": {}
}
```

Note that many of the directories previously defined in the `paths` object are now configured in the `sync` object. 

Projects created with older versions of Aquifer will need to modify their `aquifer.json` configuration to reflect this new format relative to the directories and files they are syncing into the build.
