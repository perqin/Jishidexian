// pages/new-activity/new-activity.js
import lcapi from '../../utils/lcapi';

let app = getApp();

let basicRange = [];
for (let i = 1; i <= 23; ++i) {
  basicRange.push(i);
}
basicRange = basicRange.map(v => {
  return (v < 10 ? '0' + v : '' + v) + ':00';
});

function tsToDateString(ts) {
  let dateObj = new Date(ts);
  let yearStr = dateObj.getUTCFullYear() + '';
  while (yearStr.length < 4) yearStr = '0' + yearStr;
  let monthStr = (dateObj.getUTCMonth() + 1) + '';
  while (monthStr.length < 2) monthStr = '0' + monthStr;
  let dayStr = dateObj.getUTCDate() + '';
  while (dayStr.length < 2) dayStr = '0' + dayStr;
  return yearStr + '-' + monthStr + '-' + dayStr;
}

Page({
  data: {
    userInfo: {},
    title: '',
    description: '',
    startDate: '2017-01-01',
    endDate: '2017-01-05',
    startTime: '09:00',
    endTime: '21:00',
    startTimeRange: (['00:00']).concat(basicRange),
    endTimeRange: basicRange.concat('24:00')
  },
  onLoad:function(options){
    const self = this;

    // Prepare default date
    this.setData({
      startDate: tsToDateString(Date.now().valueOf() + 86400000),
      endDate: tsToDateString(Date.now().valueOf() + 86400000 * 5)
    });

    app.getUserInfo((err, userInfo) => {
      if (err) {
        return wx.showToast({
          title: '未登录'
        });
      }

      self.setData({
        userInfo: userInfo
      });
    });
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  fmTitleInput: function (e) {
    this.setData({
      title: e.detail.value
    });
  },
  fmDescriptionInput: function (e) {
    this.setData({
      description: e.detail.value
    });
  },
  fmStartDateChange: function (e) {
    if (e.detail.value.localeCompare(this.data.endDate) > 0) {
      this.setData({
        endDate: e.detail.value
      });
    }
    this.setData({
      startDate: e.detail.value
    });
  },
  fmEndDateChange: function (e) {
    if (this.data.startDate.localeCompare(e.detail.value) > 0) {
      return wx.showToast({title: '结束日期不能早于开始日期'});
    }
    this.setData({
      endDate: e.detail.value
    });
  },
  fmStartTimeChange: function (e) {
    let startTime = this.data.startTimeRange[e.detail.value];
    if (startTime.localeCompare(this.data.endTime) >= 0) {
      let h = parseInt(startTime.substr(0, 2)) + 1;
      h = (h < 10 ? '0' + h : '' + h) + ':00';
      this.setData({
        endTime: h
      });
    }
    this.setData({
      startTime: startTime
    });
  },
  fmEndTimeChange: function (e) {
    let endTime = this.data.endTimeRange[e.detail.value];
    if (this.data.startTime.localeCompare(endTime) > 0) {
      return wx.showToast({title: '结束时间不能早于开始时间'});
    }
    this.setData({
      endTime: endTime
    });
  },
  fmSubmit: function (e) {
    let self = this;

    if (!this.data.userInfo.objectId) {
      return wx.showToast({title: '未登录'});
    }
    if (this.data.title == '') {
      return wx.showToast({title: '标题不能为空'});
    }
    if (this.data.startDate.localeCompare(this.data.endDate) > 0) {
      return wx.showToast({title: '结束日期不能早于开始日期'});
    }
    if (this.data.startTime.localeCompare(this.data.endTime) >= 0) {
      return wx.showToast({title: '结束时间必须晚于开始时间'});
    }

    lcapi.createActivity(
      this.data.userInfo.objectId,
      this.data.title,
      this.data.description,
      this.data.startDate,
      this.data.endDate,
      this.data.startTime,
      this.data.endTime,
      (err, data) => {
        if (err) {
          return wx.showToast({title: '发起活动失败'});
        }
        
        wx.showToast({title: '成功创建：' + self.data.title});
        wx.redirectTo({
          url: '/pages/activity/activity?objectId=' + data.objectId
        });
      }
    );
  }
});
