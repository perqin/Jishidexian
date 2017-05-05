// pages/index/participated-in.js
import lcapi from '../../utils/lcapi';

let app = getApp();

Page({
  data:{
    userInfo: {},
    participatedActivities: []
  },
  onLoad:function(options){
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
      lcapi.getUserParticipatedActivities(userInfo.objectId, (err, data) => {
        if (err) {
          return wx.showToast({title: '加载活动列表失败'});
        }
        
        self.setData({
          participatedActivities: data
        });
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
  }
})