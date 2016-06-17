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

}
