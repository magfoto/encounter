'use strict';

var State = {};

State.ATTRACT = 'attract';
State.WAIT_FOR_ENEMY = 'waitForEnemy';
State.COMBAT = 'combat';
State.WAIT_FOR_PORTAL = 'waitForPortal';
State.WARP = 'warp';
State.GAME_OVER = 'gameOver';
State.current = null;

State.actors = [];

State.worldNumber = null;
State.enemiesRemaining = null;

State.isPaused = false;

// called once at startup. Go into our first state
State.init = function()
{
  Sound.init();
  Attract.init();
  State.setupAttract();
}

State.initWorld = function()
{
  document.body.style.background = C64.css.lightblue; // TODO move somewhere sensible
  Overlay.init();
  Ground.init();
  Grid.init();
  Player.init();
  Enemy.init();
  Missile.init();
  Saucer.init();
  YellowSaucer.init();
  BlueSaucer.init();
  Camera.init();
  Controls.init();
  Radar.init();
  Portal.init();
  Warp.init();
  GUI.init(); // depends on Controls.init
  Indicators.init();
  Explode.init();

  State.worldNumber = 1;
  State.resetEnemyCounter();
}

State.resetEnemyCounter = function()
{
  State.enemiesRemaining = 6;
}

State.setupAttract = function()
{
  Touch.init(); // FIXME depends on Controls.init
  
  State.current = State.ATTRACT;
  log(State.current);
  Attract.show();
}

State.setupWaitForEnemy = function()
{
  State.current = State.WAIT_FOR_ENEMY;
  log(State.current);

  Overlay.update();
  Enemy.startSpawnTimer();
}

State.setupWaitForPortal = function()
{
  State.current = State.WAIT_FOR_PORTAL;
  log(State.current);

  Overlay.update();
  Portal.startSpawnTimer();
}

State.setupCombat = function()
{
  State.current = State.COMBAT;
  log(State.current);
}

State.setupGameOver = function()
{
  State.current = State.GAME_OVER;
  log(State.current);
  Camera.useOrbitMode();
}

State.setupWarp = function()
{
  State.current = State.WARP;
  log(State.current);

  Warp.setup();
}

State.enemyKilled = function()
{
  log('enemy destroyed');
  State.enemiesRemaining -= 1;
  if (State.enemiesRemaining > 0)
  {
    State.setupWaitForEnemy();
  }
  else
  {
    State.setupWaitForPortal();
  }
}

State.updateAttractMode = function(timeDeltaMillis)
{
  if (Keys.shooting)
  {
    Attract.hide();
    document.body.appendChild(renderer.domElement);
    State.initWorld();
    State.setupWaitForEnemy();
  }
}

State.updateWaitForEnemy = function(timeDeltaMillis)
{
  Controls.current.update(timeDeltaMillis);
  Player.update(timeDeltaMillis);
  Camera.update(timeDeltaMillis);

  // update non-Player game State.actors
  if (!State.isPaused)
  {
    State.updateActors(timeDeltaMillis);
    Controls.interpretKeys(timeDeltaMillis);
  }

  Enemy.spawnIfReady();
  Radar.update();
}

State.updateWaitForPortal = function(timeDeltaMillis)
{
  Controls.current.update(timeDeltaMillis);
  Player.update(timeDeltaMillis);
  Camera.update(timeDeltaMillis);

  // update non-Player game State.actors
  if (!State.isPaused)
  {
    State.updateActors(timeDeltaMillis);
    Controls.interpretKeys(timeDeltaMillis);
  }

  Portal.update(timeDeltaMillis);
  Radar.update();
  TWEEN.update();
}

State.updateCombat = function(timeDeltaMillis)
{
  Controls.current.update(timeDeltaMillis);
  Player.update(timeDeltaMillis);
  Camera.update(timeDeltaMillis);

  // update non-Player game State.actors
  if (!State.isPaused)
  {
    State.updateActors(timeDeltaMillis);
    Controls.interpretKeys(timeDeltaMillis);
  }

  Radar.update();
  Indicators.update(); // needed for flickering effects only
}

State.updateGameOver = function(timeDeltaMillis)
{
  Camera.update(timeDeltaMillis);  
}

// ask all State.actors to update their state based on the last time delta
State.updateActors = function(timeDeltaMillis)
{
  for (var i = 0; i < State.actors.length; i++) {
    State.actors[i].update(timeDeltaMillis);
  };
}

// called from util.js
function update(timeDeltaMillis)
{
  switch (State.current)
  {
    case State.ATTRACT:
      State.updateAttractMode(timeDeltaMillis);
      break;
    case State.COMBAT:
      State.updateCombat(timeDeltaMillis);
      break;
    case State.WAIT_FOR_PORTAL:
      State.updateWaitForPortal(timeDeltaMillis);
      break;
    case State.WAIT_FOR_ENEMY:
      State.updateWaitForEnemy(timeDeltaMillis);
      break;
    case State.WARP:
      Warp.update(timeDeltaMillis);
      break;
    case State.GAME_OVER:
      State.updateGameOver(timeDeltaMillis);
      break;
    default:
      console.error('unknown state: ', State.current);
  }
}

State.actorIsDead = function(actor)
{
  if (typeof actor === "undefined") throw('actor undefined');

  var index = State.actors.indexOf(actor);
  if (index !== -1) {
    State.actors.splice(index, 1);
  }

  scene.remove(actor);
}