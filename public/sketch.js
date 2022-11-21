async function setup(isRestart) {
  createCanvas(400, 400);
  
  $("#how-to-play").outerWidth($("#defaultCanvas0").outerWidth());
  
  levelConverter = {
    2: [color(3, 182, 219), color(143, 37, 16), 0],
    4: [color(4, 200, 220), color(143, 42, 10), 0],
    8: [color(5, 240, 221), color(143, 47, 0), 0],
    16: [color(53, 255, 255), color(123, 71, 15), 0],
    32: [color(53, 255, 255), color(123, 61, 5), 3],
    64: [color(0, 255, 166), color(123, 61, 5), 3],
    128: [color(0, 230, 141), color(118, 31, 50), 4],
    256: [color(120, 199, 50), color(123, 32, 45), 7],
    512: [color(172, 209, 0), color(123, 32, 45), 7],
    1024: [color(202, 239, 23), color(123, 32, 45), 7], // glow shift
    2048: [color(255, 255, 20), color(113, 22, 35), 12],
    4096: [color(255, 224, 20), color(113, 22, 35), 12],
    8192: [color(225, 160, 25), color(90, 30, 54), 12],
    16384: [color(206, 92, 36), color(70, 50, 75), 20], // glow shift
    32768: [color(210, 140, 220), color(60, 38, 67), 20],
    65536: [color(245, 245, 245), color(0, 0, 0), 25],
    131072: [color(0, 0, 0), color(220, 220, 220), 25]
  };

  let oldBoard = null;
  if (!isRestart) {
    oldBoard = null

    metaPoints = metaPoints ? parseInt(metaPoints, 10) : 0;
    $("#current-score").text(metaPoints);
    $("#best-score").text(bestPoints);

    oldBoard = oldBoard ? JSON.parse(oldBoard) : null;
  }

  let hasNumbers = 0;
  if (oldBoard) {
    for (let x = 0; x < oldBoard.length; x++) {
      for (let y = 0; y < oldBoard[x].length; y++) {
        if (oldBoard[x][y]) {
          hasNumbers = 1;
          break;
        }
      }

      if (hasNumbers)
        break;
    }
  }

  moveBuildup = [];
  postMoveSync = [];

  framesSinceSync = 0;

  let options = {
    preventDefault: true
  };

  // document.body registers gestures anywhere on the page
  if (!hammer) {
    hammer = new Hammer(document.body, options);
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL
    });

    hammer.on("swipe", swiped);
  }

  boardReady = 0;
  board = await new Board(4, 90, hasNumbers ? oldBoard : null);

  boardReady = 1;
}

function draw() {
  if (!boardReady) return;

  background(220);
  
  if (!endGame) {
    if (!board.boardMove && moveBuildup.length) {
      if (moveBuildup[0] == 1) {
        board.moveLeft();
      } else if (moveBuildup[0] == 2) {
        board.moveUp();
      } else if (moveBuildup[0]  == 3) {
        board.moveRight();
      } else {
        board.moveDown();
      }
      
      postMoveSync.push(moveBuildup[0]);
      moveBuildup = moveBuildup.slice(1);
    }
    
    if (postMoveSync.length > 20 || framesSinceSync > 360) {
      framesSinceSync = 0;
      SyncMoves();
    }

    framesSinceSync++;

    board.drawBoard();
  } else {
    // end game screen
    board.drawBoard();

    fill(rectEndFiller[0], rectEndFiller[1], rectEndFiller[2], opacityEndRoller);

    opacityEndRoller += opacityEndRoller < 85 ? 0.25 : 0;

    $("#defaultCanvas0").addClass("end");
    rect(0, 0, $("#defaultCanvas0").width(), $("#defaultCanvas0").height());

    textSize(62);
    stroke(220);
    fill(220);
    text("Game over", width * 0.5 - 165, height * 0.5 + 15);
  }
}

function computeColor(rank) {
  let converterValue = levelConverter[rank] / level;
  
  return color(generalColorLevel[0] * converterValue, generalColorLevel[1] * converterValue, generalColorLevel[2] * converterValue);
}

function keyPressed() {
  if (endGame)
    return;

  key = key.toLowerCase();
  if (keyCode == LEFT_ARROW || key == 'a' || key == 'h') {
    if (board.boardMove) {
      moveBuildup.push(1);
      return;
    }
    
    postMoveSync.push(1);
    board.moveLeft();
  } else if (keyCode == UP_ARROW || key == 'w' || key == 'k') {
    if (board.boardMove) {
      moveBuildup.push(2);
      return;
    }
    
    postMoveSync.push(2);
    board.moveUp();
  } else if (keyCode == RIGHT_ARROW || key == 'd' || key == 'l') {
    if (board.boardMove) {
      moveBuildup.push(3);
      return;
    }
    
    postMoveSync.push(3);
    board.moveRight();
  } else if (keyCode == DOWN_ARROW || key == 's' || key == 'j') {
    if (board.boardMove) {
      moveBuildup.push(4);
      return;
    }
    
    postMoveSync.push(4);
    board.moveDown();
  }
}

function swiped(event) {
  if (endGame)
    return;

  if (event.angle > 135 || event.angle < -135) {
    if (board.boardMove) {
      moveBuildup.push(1);
      return;
    }
    
    postMoveSync.push(1);
    board.moveLeft();
  } else if (event.angle < -45 && event.angle >= -135) {
    if (board.boardMove) {
      moveBuildup.push(2);
      return;
    }
    
    postMoveSync.push(2);
    board.moveUp();
  } else if (event.angle < 45 && event.angle >= -45) {
    if (board.boardMove) {
      moveBuildup.push(3);
      return;
    }
    
    postMoveSync.push(3);
    board.moveRight();
  } else if (event.angle > 45 && event.angle <= 135) {
    if (board.boardMove) {
      moveBuildup.push(4);
      return;
    }
    
    postMoveSync.push(4);
    board.moveDown();
  }
}


function SyncMoves() {
  let MovesToSend = postMoveSync;
  postMoveSync = [];

  console.log(MovesToSend);
  $.post("/move-game", MovesToSend).then(res => {
    console.log(res);

    if (res == "2") {
      // game broken
    } else if (res == "1") {
      // game broken
    }
  }).catch(e => {

  });
}
