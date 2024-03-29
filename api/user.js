const bcrypt = require('bcrypt-nodejs');

module.exports = (app) => {
  const { existsOrError, notExistsOrError, equalsOrError } = app.api.validation;

  const encryptPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);

    return bcrypt.hashSync(password, salt);
  };

  const save = async (req, res) => {
    const user = { ...req.body };

    if (req.params.id) user.id = req.params.id;

    if (!req.originalUrl.startsWith('/users')) user.admin = false;
    if (!req.user || !req.user.admin) user.admin = false;

    try {
      existsOrError(user.name, 'Name is required');
      existsOrError(user.email, 'Email is required');
      existsOrError(user.password, 'Password is required');
      existsOrError(user.confirmPassword, 'Confirm Password is required');
      equalsOrError(
        user.password,
        user.confirmPassword,
        'Passwords do not match'
      );

      const userFromDB = await app
        .db('users')
        .where({
          email: user.email,
        })
        .first();

      if (!user.id) notExistsOrError(userFromDB, 'User exists');
    } catch (err) {
      res.status(400).send({
        status: 400,
        data: err,
      });
    }

    user.password = encryptPassword(user.password);
    delete user.confirmPassword;

    if (user.id) {
      return app
        .db('users')
        .update(user)
        .where({ id: user.id })
        .whereNull('deletedAt')
        .then(() => res.status(204).send())
        .catch((err) =>
          res.status(500).send({
            status: 500,
            data: err,
          })
        );
    }

    return app
      .db('users')
      .insert(user)
      .then(() => res.status(204).send())
      .catch((err) => {
        res.status(500).send({
          status: 500,
          data: err,
        });
      });
  };

  const getAllUsers = (req, res) => {
    app
      .db('users')
      .select('id', 'name', 'email', 'admin')
      .whereNull('deletedAt')
      .then((users) =>
        res.json({
          status: 200,
          data: users,
        })
      )
      .catch((err) => {
        res.status(500).send({
          status: 500,
          data: err,
        });
      });
  };

  const getById = (req, res) => {
    const { id } = req.params;

    app.db
      .select('id', 'name', 'email', ' admin')
      .from('users')
      .where({ id })
      .whereNull('deletedAt')
      .first()
      .then((user) => {
        if (!Object.keys(user).length) {
          return res.status(404).send({
            status: 404,
            data: 'User not found',
          });
        }

        return res.json({
          status: 200,
          data: user,
        });
      })
      .catch((error) => {
        res.status(500).send({
          status: 500,
          data: error,
        });
      });

    // app.db
    //   .select('id', 'name', 'email', 'admin')
    //   .where({ id })
    //   .then((user) => {
    //     console.log('user', user);
    //   })
    //   .catch((err) => {
    //     res.status(500).send({
    //       status: 500,
    //       data: err,
    //     });
    //   });
  };

  const remove = async (req, res) => {
    try {
      const articles = await app
        .db('articles')
        .where({ userId: req.params.id });

      notExistsOrError(articles, 'User have articles');

      const rowsUpdated = await app
        .db('users')
        .update({ deletedAt: new Date() })
        .where({ id: req.params.id });

      existsOrError(rowsUpdated, 'User not found');

      res.status(204).send();
    } catch (err) {
      res.status(400).send({
        status: 400,
        data: err,
      });
    }
  };

  return {
    getAllUsers,
    save,
    getById,
    remove,
  };
};
