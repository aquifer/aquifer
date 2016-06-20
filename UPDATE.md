## New aquifer.json directory configuration

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
    "root": {
      "destination": "",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "dir",
      "hook": "postBuild"
    },
    "modules/custom": {
      "destination": "modules/custom",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "dir",
      "hook": "preBuild"
    },
    "themes/custom": {
      "destination": "themes/custom",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "dir",
      "hook": "postBuild"
    },
    "files": {
      "destination": "sites/default/files",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "dir",
      "hook": "postBuild"
    },
    "settings/settings.php": {
      "destination": "sites/default/settings.php",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "file",
      "hook": "postBuild"
    },
    "settings/secret.settings.php": {
      "destination": "sites/default/secret.settings.php",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "file",
      "hook": "postBuild"
    },
    "settings/local.settings.php": {
      "destination": "sites/default/local.settings.php",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "file",
      "hook": "postBuild"
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
