import { md5 } from './md5';
import { lcapi } from './private';

const appId = lcapi.appId;
const appKey = lcapi.appKey;

function r(uri, method, data, success, fail) {
  let ts = Date.now() + '';
  wx.request({
    url: 'https://api.leancloud.cn/1.1' + uri,
    method: method,
    data: data || '',
    header: {
      'X-LC-Id': appId,
      'X-LC-Sign': md5(ts + appKey) + ',' + ts
    },
    success: success,
    fail: fail
  });
}

function getUserByOpenId(openId, cb) {
  r(
    '/classes/WeChatUser?where={"OpenId":"' + openId + '"}',
    'GET',
    null,
    (res) => {
      cb(null, res.data.results.length === 0 ? null : res.data.results[0]);
    },
    () => {
      typeof cb == 'function' && cb(new Error('Fail to get user by OpenID: Network error'));
    }
  );
}

function createUser(openId, cb) {
  r(
    '/classes/WeChatUser?fetchWhenSave=true',
    'POST',
    {
      OpenId: openId
    },
    (res) => {
      typeof cb == 'function' && cb(null, res.data.results);
    },
    () => {
      typeof cb == 'function' && cb(new Error('Fail to create user: Network error'));
    }
  );
}

function getUserLaunchedActivities(objectId, cb) {
  r(
    '/classes/Activity?where={"Launcher":{"__type":"Pointer","className":"WeChatUser","objectId":"' + objectId + '"}}',
    'GET',
    null,
    (res) => {
      cb(null, res.data.results);
    },
    () => {
      cb(new Error('Fail to fetch launched activities'));
    }
  );
}

function getUserParticipatedActivities(objectId, cb) {
  r(
    '/classes/FreePeriod?where={"Owner":{"__type":"Pointer","className":"WeChatUser","objectId":"' + objectId + '"}}',
    'GET',
    null,
    (fpRes) => {
      let as = fpRes.data.results.map(v => {
        return v.Activity.objectId;
      });

      // Find
      r(
        '/classes/Activity?where={"objectId":{"$in":[' + as.map(v => { return '"' + v + '"'; }).join(',') + ']},"Launcher":{"$ne":{"__type":"Pointer","className":"WeChatUser","objectId":"' + objectId + '"}}}',
        'GET',
        null,
        (aRes) => {
          cb(null, aRes.data.results);
        },
        () => {
          cb(new Error('Fail to fetch launched activities #2'));
        }
      );
    },
    () => {
      cb(new Error('Fail to fetch launched activities #1'));
    }
  );
}

function createActivity(userObjectId, title, description, startDate, endDate, startTime, endTime, cb) {
  r(
    '/classes/Activity?fetchWhenSave=true',
    'POST',
    {
      Title: title,
      Description: description,
      Launcher: {
        __type: 'Pointer',
        className: 'WeChatUser',
        objectId: userObjectId
      },
      StartDate: startDate,
      EndDate: endDate,
      StartTime: startTime,
      EndTime: endTime
    },
    res => {
      cb(null, res.data);
    },
    () => {
      cb(new Error('Fail to create activity'));
    }
  );
}

function createPeriod(userObjectId, activityObjectId, date, time, cb) {
  r(
    '/classes/FreePeriod?fetchWhenSave=true',
    'POST',
    {
      Date: date,
      StartTime: time,
      EndTime: '',
      Owner: {
        __type: 'Pointer',
        className: 'WeChatUser',
        objectId: userObjectId
      },
      Activity: {
        __type: 'Pointer',
        className: 'Activity',
        objectId: activityObjectId
      }
    },
    res => {
      cb(null, res.data);
    },
    () => {
      cb(new Error('Fail to create period'));
    }
  );
}

function removePeriod(periodObjectId, cb) {
  r(
    '/classes/FreePeriod/' + periodObjectId,
    'DELETE',
    null,
    res => {
      cb(null, res.data);
    },
    () => {
      cb(new Error('Fail to remove period'));
    }
  );
}

function getActivity(objectId, cb) {
  r(
    '/classes/Activity/' + objectId,
    'GET',
    null,
    res => {
      cb(null, res.data);
    },
    () => {
      cb(new Error('Fail to get activity'));
    }
  );
}

function getPeriodsOfActivity(activityObjectId, cb) {
  r(
    '/classes/FreePeriod?where={"Activity":{"__type":"Pointer","className":"Activity","objectId":"' + activityObjectId + '"}}',
    'GET',
    null,
    res => {
      cb(null, res.data.results);
    },
    () => {
      cb(new Error('Fail to get periods'));
    }
  );
}

function getPeriodsOfActivityAndUser(activityObjectId, userObjectId, cb) {
  r(
    '/classes/FreePeriod?where={"Activity":{"__type":"Pointer","className":"Activity","objectId":"' + activityObjectId + '"},"Owner":{"__type":"Pointer","className":"WeChatUser","objectId":"' + userObjectId + '"}}',
    'GET',
    null,
    res => {
      cb(null, res.data.results);
    },
    () => {
      cb(new Error('Fail to get periods'));
    }
  );
}

module.exports = {
	getUserByOpenId: getUserByOpenId,
	createUser: createUser,
	getUserLaunchedActivities: getUserLaunchedActivities,
	getUserParticipatedActivities: getUserParticipatedActivities,
	createActivity: createActivity,
  getActivity: getActivity,
  createPeriod: createPeriod,
  removePeriod: removePeriod,
  getPeriodsOfActivity: getPeriodsOfActivity,
  getPeriodsOfActivityAndUser: getPeriodsOfActivityAndUser
};
