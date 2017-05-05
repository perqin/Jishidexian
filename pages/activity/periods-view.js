import { rgbToHex } from '../../utils/util';

function PeriodsView(context) {
  this.context = context;
  this.viewport = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };
  this.cellSize = {
    w: 72,
    h: 60
  };
  this.data = {
    activity: null,
    periods: [],
    row: 24,
    col: 5,
    maxDepth: 0,
    depth: []
  };
  this.indicatorSize = {
    dateHeight: 40,
    timeWidth: 60
  };
  this.gestures = {
    lastX: 0,
    lastY: 0
  };
  this.style = {
    depthCellColors: {
      min: { r: 0xE8, g: 0xF5, b: 0xE9 },
      max: { r: 0x1B, g: 0x5E, b: 0x20 }
    }
  }
  this.onCellTap = null;
  // Temp data to improve drawing
  this.tmpData = {
    queue: null
  };
}

// Note that this size is the canvas size
PeriodsView.prototype.setSize = function(width, height) {
  this.viewport.w = width - this.indicatorSize.timeWidth;
  this.viewport.h = height - this.indicatorSize.dateHeight;
  this.redraw();
};

PeriodsView.prototype.setData = function(data) {
  if (!data) return;
  if (data.activity) {
    this.data.activity = data.activity;
    this.data.col = (new Date(data.activity.EndDate).valueOf() - new Date(data.activity.StartDate).valueOf()) / 86400000 + 1;
    this.data.row = parseInt(data.activity.EndTime.substr(0, 2)) - parseInt(data.activity.StartTime.substr(0, 2)) + 1;
  }
  if (data.periods) {
    this.data.depth = [];
    for (let c = 0; c < this.data.col; ++c) {
      let subDepth = [];
      for (let r = 0; r < this.data.row; ++r) {
        subDepth.push(0);
      }
      this.data.depth.push(subDepth);
    }
    this.data.periods = data.periods;
    this.data.periods.forEach(period => {
      period.c = (new Date(period.Date).valueOf() - new Date(this.data.activity.StartDate).valueOf()) / 86400000;
      period.r = parseInt(period.StartTime.substr(0, 2)) - parseInt(this.data.activity.StartTime.substr(0, 2));
      ++this.data.depth[period.c][period.r];
    });
    this.data.maxDepth = 0;
    for (let c = 0; c < this.data.col; ++c) {
      for (let r = 0; r < this.data.row; ++r) {
        if (this.data.depth[c][r] > this.data.maxDepth) {
          this.data.maxDepth = this.data.depth[c][r];
        }
      }
    }
  }
  (data.activity || data.periods) && this.redraw();
};

PeriodsView.prototype.setOnCellTap = function(cb) {
  this.onCellTap = cb;
};

PeriodsView.prototype.redraw = function(dontInvalidateQueue) {
  if (!this.data.activity || !this.data.periods) return;

  // Get cells inside the viewport
  let cl = Math.floor(this.viewport.x / this.cellSize.w);
  let cr = Math.min(Math.floor((this.viewport.x + this.viewport.w - 1) / this.cellSize.w), this.data.col - 1);
  let ct = Math.floor(this.viewport.y / this.cellSize.h);
  let cb = Math.min(Math.floor((this.viewport.y + this.viewport.h - 1) / this.cellSize.h), this.data.row - 1);

  // Draw cells
  // Draw grid
  // Grid greatly influence performance, so the following code is commented out
  // this.context.setStrokeStyle('#b2b2b2');
  // for (let c = cl; c <= cr; ++c) {
  //   for (let r = ct; r <= cb; ++r) {
  //     this.context.strokeRect(
  //       this.indicatorSize.timeWidth + c * this.cellSize.w - this.viewport.x,
  //       this.indicatorSize.dateHeight + r * this.cellSize.h - this.viewport.y,
  //       this.cellSize.w,
  //       this.cellSize.h
  //     );
  //   }
  // }
  // Seperate period into different queue accourding to their depth
  if (!this.tmpData.queue || !dontInvalidateQueue) {
    this.tmpData.queue = [];
    for (let i = 0; i <= this.data.maxDepth; ++i) {
      this.tmpData.queue.push([]);
    }
    this.data.periods.forEach(period => {
      // Add this period to queue
      this.tmpData.queue[this.data.depth[period.c][period.r]].push(period);
    });
  }
  // Draw periods
  this.context.setStrokeStyle('#b2b2b2');
  this.tmpData.queue.forEach((ps, psd) => {
    // ps is the periods array and psd is the depth of them
    if (ps.length > 0 && psd > 0) {
      this.context.setFillStyle(this.data.maxDepth < 2
          ? rgbToHex(this.style.depthCellColors.min.r, this.style.depthCellColors.min.g, this.style.depthCellColors.min.b)
          : rgbToHex(
                Math.floor(this.style.depthCellColors.min.r + (this.style.depthCellColors.max.r - this.style.depthCellColors.min.r) / (this.data.maxDepth - 1) * (psd - 1)),
                Math.floor(this.style.depthCellColors.min.g + (this.style.depthCellColors.max.g - this.style.depthCellColors.min.g) / (this.data.maxDepth - 1) * (psd - 1)),
                Math.floor(this.style.depthCellColors.min.b + (this.style.depthCellColors.max.b - this.style.depthCellColors.min.b) / (this.data.maxDepth - 1) * (psd - 1))
            )
      );
      ps.forEach(p => {
        // p is the period with depth psd
        this.context.fillRect(
          this.indicatorSize.timeWidth + p.c * this.cellSize.w - this.viewport.x,
          this.indicatorSize.dateHeight + p.r * this.cellSize.h - this.viewport.y,
          this.cellSize.w,
          this.cellSize.h
        );
        // this.context.strokeRect(
        //   this.indicatorSize.timeWidth + p.c * this.cellSize.w - this.viewport.x,
        //   this.indicatorSize.dateHeight + p.r * this.cellSize.h - this.viewport.y,
        //   this.cellSize.w,
        //   this.cellSize.h
        // );
      });
    }
  });

  // Draw indicators
  this.context.setFillStyle('#dfdfdf');
  this.context.setStrokeStyle('#b2b2b2');
  for (let c = cl; c <= cr; ++c) {
    // Date boxes
    this.context.strokeRect(this.indicatorSize.timeWidth + c * this.cellSize.w - this.viewport.x, 0, this.cellSize.w, this.indicatorSize.dateHeight);
    this.context.fillRect(this.indicatorSize.timeWidth + c * this.cellSize.w - this.viewport.x, 0, this.cellSize.w, this.indicatorSize.dateHeight);
  }
  this.context.setFillStyle('#000000');
  this.context.setFontSize(10);
  this.context.setTextAlign('center');
  for (let c = cl; c <= cr; ++c) {
    // Date labels
    this.context.fillText(getDateString(this.data.activity.StartDate, c), this.indicatorSize.timeWidth + c * this.cellSize.w - this.viewport.x + this.cellSize.w / 2, 16);
  }
  this.context.setFillStyle('#00dfdf');
  this.context.setStrokeStyle('#b2b2b2');
  for (let r = ct; r <= cb; ++r) {
    // Time boxes
    this.context.strokeRect(0, this.indicatorSize.dateHeight + r * this.cellSize.h - this.viewport.y, this.indicatorSize.timeWidth, this.cellSize.h);
    this.context.fillRect(0, this.indicatorSize.dateHeight + r * this.cellSize.h - this.viewport.y, this.indicatorSize.timeWidth, this.cellSize.h);
  }
  this.context.setFillStyle('#000000');
  this.context.setFontSize(10);
  this.context.setTextAlign('center');
  for (let r = ct; r <= cb; ++r) {
    // Time labels
    this.context.fillText(getTimeString(this.data.activity.StartTime, r), this.cellSize.w / 2, this.indicatorSize.dateHeight + r * this.cellSize.h - this.viewport.y + 16);
  }
  this.context.setFillStyle('white');
  this.context.setStrokeStyle('white');
  this.context.fillRect(0, 0, this.indicatorSize.timeWidth, this.indicatorSize.dateHeight);
  this.context.strokeRect(0, 0, this.indicatorSize.timeWidth, this.indicatorSize.dateHeight);

  // Draw
  this.context.draw();
};

PeriodsView.prototype.onTouchStart = function(e) {
  this.gestures.lastX = e.touches[0].x;
  this.gestures.lastY = e.touches[0].y;
  this.gestures.initialX = this.gestures.lastX;
  this.gestures.initialY = this.gestures.lastY;
  this.gestures.initialTime = Date.now().valueOf();
};

PeriodsView.prototype.onTouchMove = function(e) {
  let nx = this.viewport.x - (e.touches[0].x - this.gestures.lastX);
  let ny = this.viewport.y - (e.touches[0].y - this.gestures.lastY);
  let invalid = false;
  if (nx >= 0 && nx + this.viewport.w <= this.data.col * this.cellSize.w) {
    this.viewport.x = nx;
    invalid = true;
  }
  if (ny >= 0 && ny + this.viewport.h <= this.data.row * this.cellSize.h) {
    this.viewport.y = ny;
    invalid = true;
  }
  if (invalid) {
    this.redraw(true);
  }
  this.gestures.lastX = e.touches[0].x;
  this.gestures.lastY = e.touches[0].y;
};

PeriodsView.prototype.onTouchEnd = function(e) {
  if (Math.abs(e.changedTouches[0].x - this.gestures.initialX) <= 4 && Math.abs(e.changedTouches[0].y - this.gestures.initialY) <= 4
      && Date.now().valueOf() - this.gestures.initialTime <= 100) {
    let absX = e.changedTouches[0].x - this.indicatorSize.timeWidth + this.viewport.x;
    let absY = e.changedTouches[0].y - this.indicatorSize.dateHeight + this.viewport.y;
    // Not triggered when the touched cell is beneath the indicator
    if (e.changedTouches[0].x < this.indicatorSize.timeWidth || e.changedTouches[0].y < this.indicatorSize.dateHeight) return;
    // Not triggered when the touched position is not inside the whole grid
    if (absX < 0 || absX >= this.data.col * this.cellSize.w || absY < 0 || absY >= this.data.row * this.cellSize.h) return;
    let x = Math.floor(absX / this.cellSize.w);
    let y = Math.floor(absY / this.cellSize.h);
    if (typeof this.onCellTap == 'function') {
      let ps = [];
      this.data.periods.forEach(period => {
        if (period.c == x && period.r == y) {
          ps.push(period);
        }
      });
      this.onCellTap(x, y, ps);
    }
  }
};

PeriodsView.prototype.onTouchCancel = function(e) {
};

function getDateString(startDate, index) {
  let s = new Date(startDate).valueOf();
  s += index * 86400000;
  let ro = new Date(s);
  let yearStr = ro.getUTCFullYear() + '';
  while (yearStr.length < 4) yearStr = '0' + yearStr;
  let monthStr = (ro.getUTCMonth() + 1) + '';
  while (monthStr.length < 2) monthStr = '0' + monthStr;
  let dayStr = ro.getUTCDate() + '';
  while (dayStr.length < 2) dayStr = '0' + dayStr;
  return yearStr + '-' + monthStr + '-' + dayStr;
}

function getTimeString(startTime, index) {
  let s = (parseInt(startTime.substr(0, 2)) + index) + ':00';
  return s.length == 4 ? '0' + s : s;
}

module.exports = PeriodsView;
