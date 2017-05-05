//app.js
import lcapi from './utils/lcapi';
import { wxmp } from './utils/private';

App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo: function (cb) {
    var that = this;
    if(this.globalData.userInfo && this.globalData.userInfo.openId && this.globalData.userInfo.objectId) {
      typeof cb == "function" && cb(null, this.globalData.userInfo);
    } else {
      //调用登录接口
      wx.login({
        success: function (res) {
          if (res.code) {
            wx.request({
              url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + that.mpData.appId + '&secret=' + that.mpData.secret + '&js_code=' + res.code + '&grant_type=authorization_code',
              success: (oiRes) => {
                let openId = oiRes.data.openid;
                let sessionKey = oiRes.data.session_key;

                function getUserInfo(objectId) {
                  wx.getUserInfo({
                    success: uiRes => {
                      that.globalData.userInfo = uiRes.userInfo;
                      that.globalData.userInfo.openId = openId;
                      that.globalData.userInfo.objectId = objectId;
                      typeof cb == "function" && cb(null, that.globalData.userInfo);
                    },
                    fail: () => {
                      typeof cb == 'function' && cb(new Error('Fail to get user info'));
                    }
                  });
                }

                // Create user if needed
                lcapi.getUserByOpenId(openId, (err, userData) => {
                  if (err) {
                    return cb(new Error('Fail to get user'));
                  }

                  if (!userData) {
                    // Create user
                    lcapi.createUser(openId, (err, newUserData) => {
                      if (err) {
                        return cb(new Error('Fail to get user'));
                      }

                      // User created
                      getUserInfo(newUserData.objectId);
                    });
                  } else {
                    // User exists
                    getUserInfo(userData.objectId);
                  }
                });
              },
              fail: () => {
                typeof cb == 'function' && cb(new Error('Fail to get OpenID: Network error'));
              }
            });
          } else {
            typeof cb == 'function' && cb(new Error('Fail to login: errMsg = ' + res.errMsg));
          }
        },
        fail: () => {
          typeof cb == 'function' && cb(new Error('Fail to login'));
        }
      });
    }
  },
  globalData:{
    userInfo:null
  },
  mpData: {
    appId: wxmp.appId,
    secret: wxmp.secret
  }
});
