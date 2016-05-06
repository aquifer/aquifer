## New aquifer.json directory configuration

The configuration for Drupal directories in `aquifer.json` has changed.

The new default configuration looks something like this:

```
{
  "name": "aquifer-d8",
  "core": 8,
  "paths": {
    "make": "drupal.make.yml",
    "lock": false,
    "build": "build"
  },
  "sync": {
    "directories": {
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
      "root/.htaccess": {
        "destination": ".htaccess",
        "method": "symlink",
        "conflict": "overwrite"
      },
      "root/robots.txt": {
        "destination": "robots.txt",
        "method": "symlink",
        "conflict": "overwrite"
      },
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

Project created with older versions of Aquifer will need to modify their `aquifer.json` configuration to reflect this new format relative to the directories and files they are syncing into the build.
