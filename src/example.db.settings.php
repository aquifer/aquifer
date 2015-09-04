<?php
/**
 * @file
 * Database settings for the site.
 *
 * If this file is named db.settings.php it will be kept out of version control
 * to protect sensitive site information.
 */

$databases = array (
  'default' =>
    array (
      'default' =>
        array (
          'database' => 'database',
          'username' => 'username',
          'password' => 'password',
          'host' => 'localhost',
          'port' => '',
          'driver' => 'mysql',
          'prefix' => '',
        ),
    ),
);
