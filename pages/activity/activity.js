// pages/activity/activity.js
import lcapi from '../../utils/lcapi';
import PeriodsView from './periods-view';

let app = getApp();

Page({
  data:{
    activityObjectId: '',
    activity: {},
    periods: [],
    userInfo: {}
  },
  customData: {
    periodsView: null,
    headerViewHeight: 77
  },
  onLoad: function (options) {
    this.data.activityObjectId = options.objectId;
  },
  onReady: function() {
    let systemInfo = wx.getSystemInfoSync();
    let context = wx.createCanvasContext('periodsCanvas');
    let pv = new PeriodsView(context);
    pv.setSize(systemInfo.windowWidth, systemInfo.windowHeight - this.customData.headerViewHeight);
    pv.setOnCellTap(this.onCellTap);
    this.customData.periodsView = pv;
  },
  onShow: function() {
    let self = this;
    // Get data and update
    app.getUserInfo((err, info) => {
      if (err) return wx.showToast({title: 'Fail to get user info'});

      self.setData({
        userInfo: info
      });

      // We can get data now
      // Activity data
      lcapi.getActivity(self.data.activityObjectId, (err, activityData) => {
        if (err) {
          wx.showToast({title: '加载失败'});
          return wx.navigateBack();

        } else if (!activityData) {
          wx.showToast({title: '活动不存在'});
          return wx.navigateBack();
        }

        self.setData({
          activity: activityData
        });
        self.customData.periodsView && self.customData.periodsView.setData({
          activity: activityData
        });

        // Now we can get periods data
        // Period data
        if (activityData.Launcher.objectId == info.objectId) {
          // Launcher open, show all periods
          lcapi.getPeriodsOfActivity(activityData.objectId, (err, periodsData) => {
            if (err) return wx.showToast({title: 'Fail to load periods'});

            self.setData({
              periods: periodsData
            });
            self.customData.periodsView && self.customData.periodsView.setData({
              periods: periodsData
            });
          });
        } else {
          // Show self periods
          lcapi.getPeriodsOfActivityAndUser(activityData.objectId, info.objectId, (err, periodsData) => {
            if (err) return wx.showToast({title: 'Fail to load periods'});

            self.setData({
              periods: periodsData
            });
            self.customData.periodsView && self.customData.periodsView.setData({
              periods: periodsData
            });
          })
        }
      });
    });
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  onShareAppMessage: function () {
    return {
      title: '几时得闲：' + this.data.activity.Title,
      path: '/pages/activity/activity?objectId=' + this.data.activity.objectId,
      success: () => {
        wx.showToast({title: 'Share succeed!'});
      },
      fail: (res) => {
        wx.showToast({title: 'Share fail!'});
        console.error(res);
      }
    }
  },
  ceTouchStart: function (e) {
    this.customData.periodsView && this.customData.periodsView.onTouchStart(e);
  },
  ceTouchMove: function (e) {
    this.customData.periodsView && this.customData.periodsView.onTouchMove(e);
  },
  ceTouchEnd: function (e) {
    this.customData.periodsView && this.customData.periodsView.onTouchEnd(e);
  },
  ceTouchCancel: function (e) {
    this.customData.periodsView && this.customData.periodsView.onTouchCancel(e);
  },
  onCellTap: function (c, r, periods) {
    let period = null;
    periods.forEach(p => {
      if (p.Owner.objectId == this.data.userInfo.objectId) {
        period = p;
      }
    });
    if (period) {
      // Remove this period
      lcapi.removePeriod(period.objectId, (err, data) => {
        if (err) return wx.showToast({title: '删除空闲时间失败'});

        for (let i = 0; i < this.data.periods.length; ++i) {
          if (this.data.periods[i].objectId == period.objectId) {
            this.data.periods.splice(i, 1);
            break;
          }
        }
        let newPeriods = this.data.periods;
        this.setData({
          periods: newPeriods
        });
        this.customData.periodsView && this.customData.periodsView.setData({
          periods: newPeriods
        });
      });
    } else {
      let dateObj = new Date(new Date(this.data.activity.StartDate).valueOf() + c * 86400000);
      let yearStr = dateObj.getUTCFullYear() + '';
      while (yearStr.length < 4) yearStr = '0' + yearStr;
      let monthStr = (dateObj.getUTCMonth() + 1) + '';
      while (monthStr.length < 2) monthStr = '0' + monthStr;
      let dayStr = dateObj.getUTCDate() + '';
      while (dayStr.length < 2) dayStr = '0' + dayStr;
      let date = yearStr + '-' + monthStr + '-' + dayStr;
      let time = (parseInt(this.data.activity.StartTime.substr(0, 2)) + r) + ':00';
      if (time.length == 4) time = '0' + time;
      lcapi.createPeriod(this.data.userInfo.objectId, this.data.activity.objectId, date, time, (err, data) => {
        if (err) return wx.showToast({title: '添加空闲时间失败'});

        let newPeriods = this.data.periods.concat(data);
        this.setData({
          periods: newPeriods
        });
        this.customData.periodsView && this.customData.periodsView.setData({
          periods: newPeriods
        });
      });
    }
  }
});
