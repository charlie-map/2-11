function setup() {
  createCanvas(400, 400);
  
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
	65536: [color(245, 245, 245), color(0, 0, 0), 25]
  };
  
  board = new Board(4, 90);
  moveBuildup = [];
}

function draw() {
  background(220);
  
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
    
    moveBuildup = moveBuildup.slice(1);
  }
  
  board.drawBoard();
}

function computeColor(rank) {
  let converterValue = levelConverter[rank] / level;
  
  return color(generalColorLevel[0] * converterValue, generalColorLevel[1] * converterValue, generalColorLevel[2] * converterValue);
}

function keyPressed() {
  if (keyCode == LEFT_ARROW) {
    if (board.boardMove) {
      moveBuildup.push(1);
      return;
    }
    
    board.moveLeft();
  } else if (keyCode == UP_ARROW) {
    if (board.boardMove) {
      moveBuildup.push(2);
      return;
    }
    
    board.moveUp();
  } else if (keyCode == RIGHT_ARROW) {
    if (board.boardMove) {
      moveBuildup.push(3);
      return;
    }
    
    board.moveRight();
  } else if (keyCode == DOWN_ARROW) {
    if (board.boardMove) {
      moveBuildup.push(4);
      return;
    }
    
    board.moveDown();
  }
}