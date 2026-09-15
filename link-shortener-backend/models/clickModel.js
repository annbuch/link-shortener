let clicks = [];
let clickIdCounter = 1;

const add = (clickData) => {
  const newClick = {
    id: clickIdCounter++,
    ...clickData,
    timestamp: Date.now()
  };
  clicks.push(newClick);
  return newClick;
};

const getByLinkId = (linkId, filters = {}) => {
  let result = clicks.filter(c => c.linkId === linkId);
  if (filters.fromDate) {
    result = result.filter(c => c.timestamp >= filters.fromDate);
  }
  if (filters.toDate) {
    result = result.filter(c => c.timestamp <= filters.toDate);
  }
  return result;
};

const getStats = (linkId) => {
  const linkClicks = clicks.filter(c => c.linkId === linkId);
  const total = linkClicks.length;
  const uniqueIPs = new Set(linkClicks.map(c => c.ip)).size;
  //TODO: Можно добавить группировку по дням и т.д.
  return { total, uniqueIPs };
};

const getDailyStats = (linkId) => {
  const linkClicks = clicks.filter(c => c.linkId === linkId);
  const daily = {};
  linkClicks.forEach(c => {
    const date = new Date(c.timestamp).toISOString().split('T')[0];
    daily[date] = (daily[date] || 0) + 1;
  });
  return daily;
};

const getGeoStats = (linkId) => {
  const linkClicks = clicks.filter(c => c.linkId === linkId);
  const geo = {};
  linkClicks.forEach(c => {
    const country = c.location?.country || 'Unknown';
    geo[country] = (geo[country] || 0) + 1;
  });
  return geo;
};

const getDeviceStats = (linkId) => {
  const linkClicks = clicks.filter(c => c.linkId === linkId);
  const devices = {};
  linkClicks.forEach(c => {
    const ua = c.userAgent || '';
    let type = 'Other';
    if (/mobile/i.test(ua)) type = 'Mobile';
    else if (/tablet/i.test(ua)) type = 'Tablet';
    else if (/windows|mac|linux/i.test(ua)) type = 'Desktop';
    devices[type] = (devices[type] || 0) + 1;
  });
  return devices;
};

const getReferrerStats = (linkId) => {
  const linkClicks = clicks.filter(c => c.linkId === linkId);
  const refs = {};
  linkClicks.forEach(c => {
    const ref = c.referer || 'direct';
    refs[ref] = (refs[ref] || 0) + 1;
  });
  return refs;
};

module.exports = {
  add,
  getByLinkId,
  getStats,
  getDailyStats,
  getGeoStats,
  getDeviceStats,
  getReferrerStats
};