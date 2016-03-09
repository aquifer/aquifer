<?php
/**
 * @file
 * Drupal site-specific configuration file.
 */
$databases = array();

/**
 * Include secret configuration.
 *
 * Contains database settings and other sensitive environment specific
 * information that shouldn't be in version control.
 */
if (file_exists(DRUPAL_ROOT . '/sites/default/secret.settings.php')) {
  include DRUPAL_ROOT . '/sites/default/secret.settings.php';
}
$config_directories = array();
$settings['update_free_access'] = FALSE;
$config['system.performance']['fast_404']['exclude_paths'] = '/\/(?:styles)|(?:system\/files)\//';
$config['system.performance']['fast_404']['paths'] = '/\.(?:txt|png|gif|jpe?g|css|js|ico|swf|flv|cgi|bat|pl|dll|exe|asp)$/i';
$config['system.performance']['fast_404']['html'] = '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL "@path" was not found on this server.</p></body></html>';
$settings['container_yamls'][] = __DIR__ . '/services.yml';
ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);
ini_set('session.gc_maxlifetime', 200000);
ini_set('session.cookie_lifetime', 2000000);

/**
 * Include local configuration.
 *
 * IMPORTANT: This block should remain at the bottom of this file.
 */
if (file_exists(DRUPAL_ROOT . '/sites/default/local.settings.php')) {
  include DRUPAL_ROOT . '/sites/default/local.settings.php';
}
