<?php

/**
 * @file
 * Contains \DrupalProject\composer\ScriptHandler.
 */

namespace DrupalProject\composer;

use Composer\Script\Event;
use Symfony\Component\Filesystem\Filesystem;

class ScriptHandler {

  public static function buildScaffold(Event $event) {
    $fs = new Filesystem();
    if (!$fs->exists(getcwd()) . '/autoload.php') {
      \DrupalComposer\DrupalScaffold\Plugin::scaffold($event);
    }
  }

  public static function copyFiles(Event $event) {
    $fs = new Filesystem();
    $extra = $event->getComposer()->getPackage()->getExtra();

    if ((!$project_dir = getenv('AQUIFER_PROJECT_ROOT'))
      && isset($extra['aquifer_project_root_relative'])) {
      $project_dir = $extra['aquifer_project_root_relative'];
    }

    if ($project_dir) {
      $aquifer_json_path = $project_dir . '/aquifer.json';

      if ($fs->exists($aquifer_json_path)) {
        $build_dir = FALSE;

        // Get build directory name from aquifer.json.
        $json = file_get_contents($aquifer_json_path);
        $json_array = json_decode($json, TRUE);

        if (!empty($json_array) && isset($json_array['build']) && isset($json_array['build']['directory'])) {
          $build_dir = $json_array['build']['directory'];
        }

        // If we are executing from the build directory name defined in
        // aquifer.json, copy the Composer files back down to the project.
        if ($build_dir && $build_dir === basename(getcwd())) {
          $fs->copy('composer.json', $project_dir . '/drupal.composer.json');
          $fs->copy('composer.lock', $project_dir . '/drupal.composer.lock');
          $event->getIO()
            ->write("Copying Composer files from build to project root.");
        }
      }
    }
  }

}
