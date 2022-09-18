class Board {
  constructor(size, tileSize, oldBoard) {
    this.board = [];
    this.size = size;
    this.tileS = tileSize;
    // all current tiles from smallest to largest
    //---used for drawing to make large glow effects
    //---cast over smaller tiles
    this.orderedPieces = [];

    for (let setBoardX = 0; setBoardX < size; setBoardX++) {
      this.board[setBoardX] = [];

      for (let setBoardY = 0; setBoardY < size; setBoardY++) {
        // if (setBoardX + setBoardY == 0)
        //   continue;

        // let num = pow(2, (setBoardX * size) + setBoardY + 1);
        // this.board[setBoardX][setBoardY] = new Piece(100 * setBoardX, 100 * setBoardY, tileSize, tileSize, levelConverter[num].length ? num : 2);
        if (oldBoard && oldBoard[setBoardX][setBoardY]) {
          let oldPieceData = oldBoard[setBoardX][setBoardY];

          this.board[setBoardX][setBoardY] = new Piece(setBoardX * 100, setBoardY * 100,
            90, 90, oldPieceData.num);

          continue;
        }

        this.board[setBoardX][setBoardY] = null;
      }
    }

    // this.board[0][0] = new Piece(0, 0, 90, 90, 131072);
    // this.board[1][0] = new Piece(100, 0, 90, 90, 131072);

    // pick 2 random initial positions
    if (!oldBoard) {
      this.addPiece(tileSize);
      this.addPiece(tileSize);
    }

    this.boardMove = 0;
    this.canMove();

    this.endGameRequest = 0;
    this.sendingRequest = 0;
  }

  addPiece(tileSize) {
    // find open piece
    let findOpenX = floor(random(4));
    let findOpenY = floor(random(4));

    let realRandom = 0;
    while (this.board[findOpenX][findOpenY] && realRandom < 8) {
      findOpenX = floor(random(4));
      findOpenY = floor(random(4));
    }

    if (this.board[findOpenX][findOpenY]) {
      // find open position manually
      let x, y;
      for (x = 0; x < 4; x++) {
        for (y = 0; y < 4; y++) {
          if (!this.board[x][y]) {
            findOpenX = x;
            findOpenY = y;

            break;
          }
        }
      }

      if (x == 4 || y == 4)
        return 0;
    }

    let choose_start = floor(random(100));
    let start_number = choose_start < 89 ? 2 : choose_start < 99 ? 4 : 8;
    mostRecentPiece = start_number;
    this.board[findOpenX][findOpenY] = new Piece(100 * findOpenX, 100 * findOpenY, tileSize, tileSize, start_number);

    return 1;
  }

  drawBoard() {
    let boxWidth = width * 0.25;
    let boxHeight = height * 0.25;

    strokeWeight(8);
    stroke(10, 87, 90);
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        circle(x * boxWidth + (boxWidth * 0.5), y * boxHeight + (boxHeight * 0.5), boxWidth - (width * 0.53));
      }
    }

    strokeWeight(20);
    noFill();
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        rect(x * boxWidth, y * boxHeight, boxWidth, boxHeight);
      }
    }
    fill(255);
    strokeWeight(1);

    let isMoving = 0,
      movingPieces = 0;

    for (let i = 0; i < this.orderedPieces.length; i++) {
      this.orderedPieces[i].drawPiece();

      movingPieces += this.orderedPieces[i].moveAmount > 0 ? 1 : 0;
      isMoving += this.orderedPieces[i].moveAmount > 0 ? this.orderedPieces[i].moveAmount : 0;

      if (this.orderedPieces[i].moveAmount <= 90 && this.orderedPieces[i].merging) {
        this.orderedPieces[i].merging = 0;
        this.orderedPieces[i].itemToMerge = null;

        this.orderedPieces[i].upgrade();
        this.orderedPieces[i].animation_time = 2;
      }
    }

    if (!activelyMovingLeaderboardRank && needLeaderboardCheck)
      checkUserRankLeaderboard(metaPoints);

    if (isMoving < (45 * movingPieces) && points) {
      let prevScore = metaPoints;
      let newMetaPoints = prevScore + points;

      let personal_user_points = parseInt(($(".personal-user-points").length ?
        $(".personal-user-points").text() : "0"), 10);
      if (activeLeaderboardProperty == "Best score" && (newMetaPoints > bestPoints || newMetaPoints > personal_user_points) && newMetaPoints > metaPoints) {
        $("#best-score").text(newMetaPoints);
        let lowestLeaderboardBlock = parseInt($("#leaderboard .leaderboard-entry:last-child").find(".leaderboard-entry-score").text(), 10);

        $(".personal-user-points").text(newMetaPoints);

        if (!activelyMovingLeaderboardRank)
          checkUserRankLeaderboard(newMetaPoints);
        else
          needLeaderboardCheck = 1;

        bestPoints = newMetaPoints;
        let newScore = newMetaPoints + "";

        $("#best-score").stop();
        $("#best-score").animate({
          opacity: 0.4
        }, 150).animate({
          opacity: 1
        }, 150);

        setTimeout(function(newScore) {
          $("#best-score").text(newScore);

        }, 150, newScore);
      }

      if (prevScore + points > metaPoints) {
        $("#add-to-current-score").text("+" + points);
        $("#add-to-current-score").addClass("float");

        setTimeout(function(newMetaPoints) {
          $("#current-score").text(newMetaPoints);
        }, 100, newMetaPoints);

        if (currentScoreAnimationTimeout) {
          clearTimeout(currentScoreAnimationTimeout);
          currentScoreAnimationTimeout = null;
        }

        currentScoreAnimationTimeout = setTimeout(function(newMetaPoints) {
          $("#add-to-current-score").removeClass("float");
          $("#add-to-current-score").text("");
          currentScoreAnimationTimeout = null;
        }, 300);
      }

      metaPoints = newMetaPoints;
      points = 0;
    }

    this.boardMove = movingPieces ? 1 : 0;

    if (!this.boardMove && !this.canMove() && !this.endGameRequest) {
      if (activeLeaderboardProperty == "Average score" ||
          activeLeaderboardProperty == "Wins" ||
          activeLeaderboardProperty == "% Wins") {
        let lTab = $(".leaderboard-tab");
        $(lTab).removeClass("open")
        leaderboardCreate(lTab, 0);

        setTimeout(function() {
          $(lTab).addClass("open");
          leaderboardCreate(lTab, 0);
        }, 800);
      }

      this.endGameRequest = 1;

      $.post("/game-over", {
        board: JSON.stringify(this.board),
        score: metaPoints,
        killerPiece: mostRecentPiece
      }, (res) => {
        endGame = 1;

        localStorage.setItem("saved2-11Board", null);
        localStorage.setItem("savedCurr2-11Score", 0);

        $("#new-game").text("Try again");
      });
    }
  }

  orderPiece(piece) {
    if (!this.orderedPieces.length) {
      this.orderedPieces[0] = piece;
      return;
    }

    for (let i = 0; i < this.orderedPieces.length; i++) {
      if (piece.num >= this.orderedPieces[i].num) {
        // slot in at the current position
        this.orderedPieces.splice(i, 0, piece);
        return;
      }
    }

    this.orderedPieces.push(piece);
  }

  canMove() {
    let newHighestPiece = highestPiece;
    this.orderedPieces = [];
    // check for empty cell:
    let rowPrevNum = [0, 0, 0, 0];
    let canMove = 0;

    for (let x = 0; x < 4; x++) {
      let prevNum = 0;

      for (let y = 0; y < 4; y++) {
        if (!this.board[x][y]) {
          canMove = 1;
          continue;
        } else
          this.orderPiece(this.board[x][y]);

        newHighestPiece = newHighestPiece < this.board[x][y].num ? this.board[x][y].num : newHighestPiece;
        if (prevNum == this.board[x][y].num)
          canMove = 1;
        else
          prevNum = this.board[x][y].num;

        if (rowPrevNum[y] == this.board[x][y].num)
          canMove = 1;
        else
          rowPrevNum[y] = this.board[x][y].num;
      }
    }

    if (loggedIn && newHighestPiece > highestPiece) {
      $("#column-best-square").removeClass("bs-" + highestPiece);
      $("#column-best-square").addClass("bs-" + newHighestPiece);

      $("#column-best-square").children(".best-num").text(newHighestPiece);

      if (activeLeaderboardProperty == "Best block")
        $(".personal-user-points").text(highestPiece);
    }
    
    return canMove;
  }

  // moveDirection = 1
  moveLeft() {
    points = 0;
    this.boardMove = 1;

    let somethingMoved = 0;
    for (let y = 0; y < 4; y++) {
      let prevNum = 0;
      let maxMoveLeft = 0;

      for (let x = 0; x < 4; x++) {
        if (!this.board[x][y]) {
          maxMoveLeft++;
          continue;
        }

        if (this.board[x][y].num == prevNum) { // merge
          maxMoveLeft++;

          points += this.board[x][y].num * 2;
          this.board[x][y].merging = 1;
          this.board[x][y].itemToMerge = this.board[x - maxMoveLeft][y];

          prevNum = 0;
        } else
          prevNum = this.board[x][y].num;
        this.board[x][y].startMoveAnimation(1, maxMoveLeft);

        if (x == x - maxMoveLeft)
          continue;

        somethingMoved++;
        this.board[x - maxMoveLeft][y] = this.board[x][y];
        this.board[x][y] = null;
      }
    }

    if (somethingMoved)
      this.addPiece(this.tileS);
  }

  // moveDirection = 2
  moveUp() {
    points = 0;
    this.boardMove = 1;

    let somethingMoved = 0;
    for (let x = 0; x < 4; x++) {
      let prevNum = 0;
      let maxMoveUp = 0;

      for (let y = 0; y < 4; y++) {
        if (!this.board[x][y]) {
          maxMoveUp++;
          continue;
        }

        if (this.board[x][y].num == prevNum) { // merge
          maxMoveUp++;

          points += this.board[x][y].num * 2;
          this.board[x][y].merging = 1;
          this.board[x][y].itemToMerge = this.board[x][y - maxMoveUp];

          prevNum = 0;
        } else
          prevNum = this.board[x][y].num;
        this.board[x][y].startMoveAnimation(2, maxMoveUp);

        if (y == y - maxMoveUp)
          continue;

        somethingMoved++;
        this.board[x][y - maxMoveUp] = this.board[x][y];
        this.board[x][y] = null;
      }
    }

    if (somethingMoved)
      this.addPiece(this.tileS);
  }

  // moveDirection = 3
  moveRight() {
    points = 0;
    this.boardMove = 1;

    let somethingMoved = 0;
    for (let y = 0; y < 4; y++) {
      let prevNum = 0;
      let maxMoveRight = 0;

      for (let x = 3; x >= 0; x--) {
        if (!this.board[x][y]) {
          maxMoveRight++;
          continue;
        }

        if (this.board[x][y].num == prevNum) { // merge
          maxMoveRight++;

          points += this.board[x][y].num * 2;
          this.board[x][y].merging = 1;
          this.board[x][y].itemToMerge = this.board[x + maxMoveRight][y];

          prevNum = 0;
        } else
          prevNum = this.board[x][y].num;
        this.board[x][y].startMoveAnimation(3, maxMoveRight);

        if (x == x + maxMoveRight)
          continue;

        somethingMoved++;
        this.board[x + maxMoveRight][y] = this.board[x][y];
        this.board[x][y] = null;
      }
    }

    if (somethingMoved)
      this.addPiece(this.tileS);
  }

  // moveDirection = 4
  moveDown() {
    points = 0;
    this.boardMove = 1;

    let somethingMoved = 0;
    for (let x = 0; x < 4; x++) {
      let prevNum = 0;
      let maxMoveDown = 0;

      for (let y = 3; y >= 0; y--) {
        if (!this.board[x][y]) {
          maxMoveDown++;
          continue;
        }

        if (this.board[x][y].num == prevNum) { // merge
          maxMoveDown++;

          points += this.board[x][y].num * 2;
          this.board[x][y].merging = 1;
          this.board[x][y].itemToMerge = this.board[x][y + maxMoveDown];

          prevNum = 0;
        } else
          prevNum = this.board[x][y].num;
        this.board[x][y].startMoveAnimation(4, maxMoveDown);

        if (y == y + maxMoveDown)
          continue;

        somethingMoved++;
        this.board[x][y + maxMoveDown] = this.board[x][y];
        this.board[x][y] = null;
      }
    }

    if (somethingMoved)
      this.addPiece(this.tileS);
  }
}
