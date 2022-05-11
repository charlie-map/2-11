class Piece {
  constructor(x, y, w, h, num, c) {
    this.x = x;
    this.y = y;
    
    this.w = w;
    this.h = h;
    
    this.num = num;
    this.c = c;
    
    this.og_growth = 10;
    this.animation_time = 0;
    
    this.moveDirection = 0;
    this.moveAmount = 0;
    
    this.merging = 0;
    
    this.itemToMerge = null;
  }
  
  startMoveAnimation(moveDirection, moveAmount) {
    this.moveDirection = moveDirection;
    this.moveAmount = moveAmount * this.w + moveAmount * 10;
  }
  
  move() {
    if (this.moveAmount <= 0)
      return;
    
    let mover = this.moveAmount > 30 ? 30 : this.moveAmount;
    if (this.moveDirection == 1) { // left
      this.x -= mover;
    } else if (this.moveDirection == 2) { // up
      this.y -= mover;
    } else if (this.moveDirection == 3) { // right
      this.x += mover;
    } else if (this.moveDirection == 4) { // down
      this.y += mover;
    }
    
    this.moveAmount -= 30;
  }
  
  upgrade() {
    this.num += this.num;
  }
  
  drawTile(size_adjust, additional_w, additional_h) {
    let size10 = 10 - size_adjust,
        size5 = 5 - size_adjust,
        size3 = 3 - size_adjust,
        size1_5 = 1.5 - size_adjust,
        size0 = 0 - size_adjust
    
    beginShape();
      vertex(size0 - additional_w, size10 - additional_h);
      vertex(size1_5 - additional_w, size5 - additional_h);
      vertex(size3 - additional_w, size3 - additional_h);
      vertex(size5 - additional_w, size1_5 - additional_h);
      vertex(size10 - additional_w, size0 - additional_h);

      vertex(this.w - size10 + additional_w, size0 - additional_h);
      vertex(this.w - size5 + additional_w, size1_5 - additional_h);
      vertex(this.w - size3 + additional_w, size3 - additional_h);
      vertex(this.w - size1_5 + additional_w, size5 - additional_h);
      vertex(this.w - size0 + additional_w, size10 - additional_h);

      vertex(this.w - size0 + additional_w, this.h - size10 + additional_h);
      vertex(this.w - size1_5 + additional_w, this.h - size5 + additional_h);
      vertex(this.w - size3 + additional_w, this.h - size3 + additional_h);
      vertex(this.w - size5 + additional_w, this.h - size1_5 + additional_h);
      vertex(this.w - size10 + additional_w, this.h - size0 + additional_h);

      vertex(size10 - additional_w, this.h - size0 + additional_h);
      vertex(size5 - additional_w, this.h - size1_5 + additional_h);
      vertex(size3 - additional_w, this.h - size3 + additional_h);
      vertex(size1_5 - additional_w, this.h - size5 + additional_h);
      vertex(size0 - additional_w, this.h - size10 + additional_h);
    endShape();
  }
  
  drawPiece() {
    this.move();
    
    if (this.itemToMerge)
      this.itemToMerge.drawPiece();
    
    let adjusted_size = this.animation_time / 6;
    let additional_w = adjusted_size * 3.5;
    let additional_h = adjusted_size * 3.5;
    
    let piece_color = levelConverter[this.num];
    
    push();
    noStroke();
    
    translate(this.x + 5 + (this.og_growth * 4), this.y + 5 + (this.og_growth * 4));
    scale(map(this.og_growth, 10, 0, 0, 1));
    
    if (piece_color[2]) { // aura
      fill(red(piece_color[0]), green(piece_color[0]), blue(piece_color[0]), 8);
      
      for (let i = piece_color[2] - 1; i >= 0; i--) {
        this.drawTile(i, additional_w, additional_h);
      }
    }
  
    fill(piece_color[0]);
    this.drawTile(0, additional_w, additional_h);

    fill(piece_color[1]);
    textStyle(BOLD);
    let num_len = (this.num + "").length;
    
    let fontSize = 48 - ((num_len - 1) * 8);
    textAlign(CENTER);
    textSize(fontSize);
    text(this.num, this.w * 0.5, this.h * 0.5 + ((fontSize * 0.5) / (4/3)));
    
    pop();
    
    this.animation_time -= this.animation_time > 0 ? 1 : 0;
    this.og_growth -= this.og_growth > 0 ? 1 : 0;
  }
}