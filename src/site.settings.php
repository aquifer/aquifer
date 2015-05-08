<?php
/**
 * @file
 * Drupal site-specific configuration file.
 */

/**
 * Include database-specific configuration.
 */
include DRUPAL_ROOT . '/sites/default/db.settings.php';

/**
 * Master module configuration.
 * @see https://www.drupal.org/project/master
 */
$conf['install_profile'] = 'standard';
$conf['master_version'] = 2;
$conf['master_modules'] = array(
  'base' => array(

    // Core modules.
    'admin_menu',
    'block',
    'comment',
    'field_ui',
    'file',
    'help',
    'list',
    'maxlength',
    'menu',
    'menu_block',
    'number',
    'options',
    'path',
    'rdf',
    'search',
    'strongarm',
    'taxonomy',
    'token',
    'url',
    'views',

    // Contrib modules.
    'entity',
    'entityreference',
    'features',
    'features_extra',
    'fences',
    'field_group',
    'master',
    'panels',
    'pathauto',
    'strongarm',
    'views',

    // Custom modules.

    // Feature modules.

  ),
  'local' => array(
    'coder',
    'devel',
    'devel_generate',
    'views_ui',
  ),
  'dev' => array(),
  'test' => array(),
  'live' => array(),
);

$update_free_access = FALSE;
$drupal_hash_salt = '';

ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);
ini_set('session.gc_maxlifetime', 200000);
ini_set('session.cookie_lifetime', 2000000);

$conf['404_fast_paths_exclude'] = '/\/(?:styles)\//';
$conf['404_fast_paths'] = '/\.(?:txt|png|gif|jpe?g|css|js|ico|swf|flv|cgi|bat|pl|dll|exe|asp)$/i';
$conf['404_fast_html'] = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL "@path" was not found on this server.</p></body></html>';
