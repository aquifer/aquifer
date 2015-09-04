# Aquifer settings

## Drupal settings files

Rename the following files:

* example.settings.php to settings.php
* example.db.settings.php to db.settings.php
* example.secret.settings.php to secret.settings.php

Configure db.settings.php with the database settings for the current environment.

Add any secret configuration settings like API keys or other sensitive information to secret.settings.php.

Both of these files will be kept out of version control.

If you want to override settings for local development, rename the following file and add your overrides to it:

* example.local.settings.php to local.settings.php
