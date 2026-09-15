const users = [];
let userIdCounter = 1;

// пароль в открытом виде (пока для простоты, но в реальности нужно хэшировать)


const getAll = () => users;
const getById = (id) => users.find(u => u.id === id);
const getByEmail = (email) => users.find(u => u.email === email);
const add = (user) => {
  user.id = userIdCounter++;
  users.push(user);
  return user;
};
const update = (id, updates) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  return users[index];
};

const remove = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

module.exports = { getAll, getById, getByEmail, add, update, remove };