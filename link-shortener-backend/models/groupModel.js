let groups = [];
let groupIdCounter = 1;

const getAll = (userId) => {
  return groups.filter(g => g.userId === userId);
};

const getById = (id, userId) => {
  return groups.find(g => g.id === id && g.userId === userId);
};

const add = (groupData) => {
  const newGroup = {
    id: groupIdCounter++,
    ...groupData,
    createdAt: Date.now()
  };
  groups.push(newGroup);
  return newGroup;
};

const update = (id, userId, updates) => {
  const index = groups.findIndex(g => g.id === id && g.userId === userId);
  if (index === -1) return null;
  groups[index] = { ...groups[index], ...updates };
  return groups[index];
};

const remove = (id, userId) => {
  const index = groups.findIndex(g => g.id === id && g.userId === userId);
  if (index === -1) return false;
  groups.splice(index, 1);
  return true;
};

module.exports = { getAll, getById, add, update, remove };