let links = [
  {
    id: '1',
    originalUrl: 'https://example.com',
    shortCode: 'abc123',
    clicks: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    originalUrl: 'https://google.com',
    shortCode: 'def456',
    clicks: 5,
    createdAt: new Date().toISOString()
  }
];
let linkIdCounter = 1;

const getAll = (filters = {}) => {
  let result = links.filter(l => !l.deletedAt); // по умолчанию не удалённые
  if (filters.userId) {
    result = result.filter(l => l.userId === filters.userId);
  }
  if (filters.groupId) {
    result = result.filter(l => l.groupId === filters.groupId);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(l => 
      l.originalUrl.toLowerCase().includes(search) || 
      (l.alias && l.alias.toLowerCase().includes(search))
    );
  }

  result.sort((a, b) => b.createdAt - a.createdAt);
  return result;
};

const getTrash = (userId) => {
  return links.filter(l => l.deletedAt && l.userId === userId);
};

const getById = (id, userId) => {
  const link = links.find(l => l.id === id && l.userId === userId);
  if (!link) return null;
  
  if (link.deletedAt) return null;
  return link;
};

const getByShortCode = (shortCode) => {
  return links.find(l => l.shortCode === shortCode && !l.deletedAt);
};

const add = (linkData) => {
  const newLink = {
    id: linkIdCounter++,
    ...linkData,
    createdAt: Date.now(),
    clicks: 0,
    isActive: true,
    deletedAt: null
  };
  links.push(newLink);
  return newLink;
};

const update = (id, userId, updates) => {
  const index = links.findIndex(l => l.id === id && l.userId === userId);
  if (index === -1) return null;
  const allowedUpdates = ['originalUrl', 'alias', 'expiresAt', 'password', 'groupId', 'isActive'];
  const filteredUpdates = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }
  links[index] = { ...links[index], ...filteredUpdates };
  return links[index];
};

const softDelete = (id, userId) => {
  const index = links.findIndex(l => l.id === id && l.userId === userId);
  if (index === -1) return false;
  links[index].deletedAt = Date.now();
  return true;
};

const restore = (id, userId) => {
  const index = links.findIndex(l => l.id === id && l.userId === userId && l.deletedAt);
  if (index === -1) return false;
  links[index].deletedAt = null;
  return true;
};

const hardDelete = (id, userId) => {
  const index = links.findIndex(l => l.id === id && l.userId === userId && l.deletedAt);
  if (index === -1) return false;
  links.splice(index, 1);
  return true;
};

const incrementClicks = (shortCode) => {
  const link = links.find(l => l.shortCode === shortCode);
  if (link) link.clicks += 1;
  return link;
};


const getUserLinks = (userId) => {
  return links.filter(l => l.userId === userId && !l.deletedAt);
};

module.exports = {
  getAll,
  getTrash,
  getById,
  getByShortCode,
  add,
  update,
  softDelete,
  restore,
  hardDelete,
  incrementClicks,
  getUserLinks
};