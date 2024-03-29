const schedule = require('node-schedule');

module.exports = (app) => {
  schedule.scheduleJob('*/1 * * * *', async () => {
    const usersCount = await app.db('users').count('id').first();
    const categoriesCount = await app.db('categories').count('id').first();
    const articlesCount = await app.db('articles').count('id').first();

    const { Stat } = app.api.stats;

    const lastStat = await Stat.findOne({}, {}, { sort: { createdAt: -1 } });

    const stat = new Stat({
      users: usersCount.count,
      categories: categoriesCount.count,
      articles: articlesCount.count,
      createdAt: new Date(),
    });

    const changeUsers = !lastStat || stat.users !== lastStat.users;
    const changeCategories =
      !lastStat || stat.categories !== lastStat.categories;
    const changeArticles = !lastStat || stat.articles !== lastStat.articles;

    if (changeUsers || changeCategories || changeArticles) {
      await stat.save().then(() => console.log('[Stats] is updated!'));
    }
  });
};
