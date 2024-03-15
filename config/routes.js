module.exports = (app) => {
  app.route('/users').post(app.api.user.save).get(app.api.user.getAllUsers);

  app.route('/users/:id').put(app.api.user.save);
};
