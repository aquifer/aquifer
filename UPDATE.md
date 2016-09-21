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
      "hook": "postBuild",
      "contents": true
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
    "settings": {
      "destination": "sites/default",
      "method": "symlink",
      "conflict": "overwrite",
      "type": "file",
      "hook": "postBuild",
      "required": true,
      "contents": true
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
