// pages/index/launched.js
import lcapi from '../../utils/lcapi';

let app = getApp();

Page({
  data: {
    userInfo: {},
    launchedActivities: []
  },
  onLoad: function(options) {
  },
  onReady: function() {
    // 页面渲染完成
  },
  onShow: function() {
    const self = this;
    app.getUserInfo((err, userInfo) => {
      if (err) {
        return wx.showToast({
          title: '未登录'
        });
      }

      self.setData({
        userInfo: userInfo
      });
      lcapi.getUserLaunchedActivities(userInfo.objectId, (err, data) => {
        if (err) {
          return wx.showToast({title: '加载活动列表失败'});
        }

        self.setData({
          launchedActivities: data
        });
      });
    });
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  activityTap: function (e) {
    wx.navigateTo({
      url: '/pages/activity/activity?objectId=' + e.currentTarget.dataset.objectid
    });
  },
  ntNewActivity: function () {
    wx.navigateTo({
      url: '/pages/new-activity/new-activity'
    });
  }
});
