const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

/**
 * App Routes 
*/
router.get('/', recipeController.homepage);
router.get('/recipe/:id', recipeController.exploreRecipe);
router.get('/categories', recipeController.exploreCategories);
router.get('/categories/:id', recipeController.exploreCategoriesById);
router.post('/search', recipeController.searchRecipe);
router.get('/explore-latest', recipeController.exploreLatest);
router.get('/explore-random', recipeController.exploreRandom);
router.get('/submit-recipe', recipeController.submitRecipe);
router.post('/submit-recipe', recipeController.submitRecipeOnPost);

router.get('/search-recipe', (req, res) => {
    res.render('airec', {
      title: 'Find a Recipe',
      messages: {
        error: req.flash('error'),
      },
    });
  });
  
  // POST route for recipe search
router.post('/search-recipe', recipeController.searchrecipe);


router.get('/signup', recipeController.getSignup);
router.post('/signup', recipeController.postSignup);
router.get('/login', recipeController.getLogin);
router.post('/login', recipeController.postLogin);
router.get('/logout', recipeController.logout);


module.exports = router;