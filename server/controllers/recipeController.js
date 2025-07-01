require('../models/database');
require('dotenv').config();
const Category = require('../models/Category');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const axios = require('axios');


exports.searchrecipe = async (req, res) => {
  const { ingredients, cuisine } = req.body;

  console.log('Ingredients:', ingredients);
  console.log('Cuisine:', cuisine);

  // Sanitize inputs by trimming them
  const formattedIngredients = ingredients ? ingredients.trim() : '';
  const formattedCuisine = cuisine ? cuisine.trim() : '';

  if (!formattedIngredients || !formattedCuisine) {
    req.flash('error', 'Both ingredients and cuisine are required.');
    return res.redirect('/search-recipe');
  }

  try {
    console.log('Formatted Ingredients:', formattedIngredients);
    console.log('Formatted Cuisine:', formattedCuisine);

    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: {
        apiKey: process.env.API_KEY,
        includeIngredients: formattedIngredients,
        cuisine: formattedCuisine,
        number: 1,
        addRecipeInstructions: true
      }
    });

    console.log('API Response:', response.data);

    const recipe = response.data.results[0];

    if (recipe) {
      res.render('result', { title: 'Recipe Result', recipe });
    } else {
      req.flash('error', 'No recipe found with the given ingredients and cuisine.');
      res.redirect('/search-recipe');
    }
  } catch (error) {
    console.error('API Error:', error);
    req.flash('error', 'An error occurred while fetching the recipe. Please try again.');
    res.redirect('/search-recipe');
  }
};


// GET Signup
exports.getSignup = (req, res) => {
  res.render('signup', { title: 'Sign Up', isAuthenticated: req.session.isLoggedIn || false });
};

// POST Signup
exports.postSignup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    res.status(500).send({ message: error.message || 'Error occurred during signup' });
  }
};



// POST Login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    res.status(500).send({ message: error.message || 'Error occurred during login' });
  }
};

exports.getLogin = (req, res) => {
  res.render('login', {
    title: 'Login',
    isAuthenticated: req.session.isLoggedIn || false  // Explicitly pass `isAuthenticated`
  });
};

// GET Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ message: err.message || 'Error occurred during logout' });
    }
    res.redirect('/login');
  });
};

/**
 * GET /
 * Homepage 
*/
exports.homepage = async (req, res) => {
  try {
    const limitNumber = 5;
    const categories = await Category.find({}).limit(limitNumber);
    const latest = await Recipe.find({}).sort({ _id: -1 }).limit(limitNumber);
    const thai = await Recipe.find({ 'category': 'Thai' }).limit(limitNumber);
    const american = await Recipe.find({ 'category': 'American' }).limit(limitNumber);
    const chinese = await Recipe.find({ 'category': 'Chinese' }).limit(limitNumber);

    const food = { latest, thai, american, chinese };

    res.render('index', { title: 'Cooking Blog - Home', categories, food, isAuthenticated: req.session.isLoggedIn || false });
  } catch (error) {
    res.satus(500).send({ message: error.message || "Error Occured" });
  }
}

/**
 * GET /categories
 * Categories 
*/
exports.exploreCategories = async (req, res) => {
  try {
    const limitNumber = 20;
    const categories = await Category.find({}).limit(limitNumber);
    res.render('categories', { title: 'Cooking Blog - Categories', categories });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occured" });
  }
}


/**
 * GET /categories/:id
 * Categories By Id
*/
exports.exploreCategoriesById = async (req, res) => {
  try {
    let categoryId = req.params.id;
    const limitNumber = 20;
    const categoryById = await Recipe.find({ 'category': categoryId }).limit(limitNumber);
    res.render('categories', { title: 'Cooking Blog - Categoreis', categoryById });
  } catch (error) {
    res.satus(500).send({ message: error.message || "Error Occured" });
  }
}

/**
 * GET /recipe/:id
 * Recipe 
*/
exports.exploreRecipe = async (req, res) => {
  try {
    let recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);
    res.render('recipe', { title: 'Cooking Blog - Recipe', recipe });
  } catch (error) {
    res.satuts(500).send({ message: error.message || "Error Occured" });
  }
}


/**
 * POST /search
 * Search 
*/
exports.searchRecipe = async (req, res) => {
  try {
    let searchTerm = req.body.searchTerm.trim();  // Trim whitespace from the search term

    // Use $regex for a partial match (case-insensitive)
    let recipe = await Recipe.find({
      name: { $regex: new RegExp(searchTerm, 'i') }  // 'i' makes it case-insensitive
    });

    res.render('search', { title: 'Cooking Blog - Search', recipe });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};



/**
 * GET /explore-latest
 * Explplore Latest 
*/
exports.exploreLatest = async (req, res) => {
  try {
    const limitNumber = 20;
    const recipe = await Recipe.find({}).sort({ _id: -1 }).limit(limitNumber);
    res.render('explore-latest', { title: 'Cooking Blog - Explore Latest', recipe });
  } catch (error) {
    res.satus(500).send({ message: error.message || "Error Occured" });
  }
}



/**
 * GET /explore-random
 * Explore Random as JSON
*/
exports.exploreRandom = async (req, res) => {
  try {
    let count = await Recipe.find().countDocuments();
    let random = Math.floor(Math.random() * count);
    let recipe = await Recipe.findOne().skip(random).exec();
    res.render('explore-random', { title: 'Cooking Blog - Explore Latest', recipe });
  } catch (error) {
    res.satus(500).send({ message: error.message || "Error Occured" });
  }
}


/**
 * GET /submit-recipe
 * Submit Recipe
*/
exports.submitRecipe = async (req, res) => {
  const infoErrorsObj = req.flash('infoErrors');
  const infoSubmitObj = req.flash('infoSubmit');
  res.render('submit-recipe', { title: 'Cooking Blog - Submit Recipe', infoErrorsObj, infoSubmitObj });
}

/**
 * POST /submit-recipe
 * Submit Recipe
*/
exports.submitRecipeOnPost = async (req, res) => {
  try {

    let imageUploadFile;
    let uploadPath;
    let newImageName;

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('No Files where uploaded.');
    } else {

      imageUploadFile = req.files.image;
      newImageName = Date.now() + imageUploadFile.name;

      uploadPath = require('path').resolve('./') + '/public/uploads/' + newImageName;

      imageUploadFile.mv(uploadPath, function (err) {
        if (err) return res.satus(500).send(err);
      })

    }

    const newRecipe = new Recipe({
      name: req.body.name,
      description: req.body.description,
      email: req.body.email,
      ingredients: req.body.ingredients,
      category: req.body.category,
      image: newImageName
    });

    await newRecipe.save();

    req.flash('infoSubmit', 'Recipe has been added.')
    res.redirect('/submit-recipe');
  } catch (error) {
    // res.json(error);
    req.flash('infoErrors', error);
    res.redirect('/submit-recipe');
  }
}




// Delete Recipe
// async function deleteRecipe(){
//   try {
//     await Recipe.deleteOne({ name: 'New Recipe From Form' });
//   } catch (error) {
//     console.log(error);
//   }
// }
// deleteRecipe();


// Update Recipe
// async function updateRecipe(){
//   try {
//     const res = await Recipe.updateOne({ name: 'New Recipe' }, { name: 'New Recipe Updated' });
//     res.n; // Number of documents matched
//     res.nModified; // Number of documents modified
//   } catch (error) {
//     console.log(error);
//   }
// }
// updateRecipe();


/**
 * Dummy Data Example
*/

// async function insertDymmyCategoryData(){
//   try {
//     await Category.insertMany([
//       {
//         "name": "Thai",
//         "image": "thai-food.jpg"
//       },
//       {
//         "name": "American",
//         "image": "american-food.jpg"
//       }, 
//       {
//         "name": "Chinese",
//         "image": "chinese-food.jpg"
//       },
//       {
//         "name": "Mexican",
//         "image": "mexican-food.jpg"
//       }, 
//       {
//         "name": "Indian",
//         "image": "indian-food.jpg"
//       },
//       {
//         "name": "Spanish",
//         "image": "spanish-food.jpg"
//       },
//       {
//         "name": "Others",
//         "image": "view-all.jpg"
//       }
//     ]);
//   } catch (error) {
//     console.log('err', + error)
//   }
// }
// insertDymmyCategoryData();
// async function insertDymmyRecipeData() {
//   try {
//     await Recipe.insertMany([
//       { 
//         name: "Classic Margherita Pizza",
//         description: "A delicious, classic Margherita pizza with fresh mozzarella, tomatoes, and basil.",
//         email: "pizza@recipeblog.com",
//         ingredients: [
//           "500g pizza dough",
//           "200g fresh mozzarella cheese",
//           "3 ripe tomatoes",
//           "Fresh basil leaves",
//           "2 tablespoons olive oil",
//           "Salt and pepper to taste"
//         ],
//         category: "Chinese", 
//         image: "margherita-pizza.jpg"
//       },
//       { 
//         name: "Chicken Tikka Masala",
//         description: "Tender chicken pieces marinated in spices and yogurt, served in a flavorful creamy tomato sauce.",
//         email: "chickenmasala@recipeblog.com",
//         ingredients: [
//           "500g boneless chicken",
//           "1 cup plain yogurt",
//           "2 tablespoons garam masala",
//           "1 tablespoon turmeric",
//           "2 teaspoons ground cumin",
//           "1 tablespoon chili powder",
//           "400g canned tomatoes",
//           "200ml heavy cream",
//           "Fresh cilantro for garnish"
//         ],
//         category: "Indian", 
//         image: "chicken-tikka-masala.jpg"
//       },
//       { 
//         name: "Beef Stroganoff",
//         description: "A comforting dish of sautéed beef in a creamy mushroom sauce, served with egg noodles.",
//         email: "beefstroganoff@recipeblog.com",
//         ingredients: [
//           "500g beef strips",
//           "1 onion, chopped",
//           "200g mushrooms, sliced",
//           "2 cloves garlic, minced",
//           "200ml sour cream",
//           "1 tablespoon Dijon mustard",
//           "2 tablespoons butter",
//           "Egg noodles, cooked",
//           "Fresh parsley for garnish"
//         ],
//         category: "Thai", 
//         image: "beef-stroganoff.jpg"
//       },
//       { 
//         name: "Tacos al Pastor",
//         description: "Authentic Mexican tacos made with marinated pork and grilled pineapple, served on corn tortillas.",
//         email: "tacos@recipeblog.com",
//         ingredients: [
//           "500g pork shoulder, thinly sliced",
//           "2 tablespoons achiote paste",
//           "3 cloves garlic, minced",
//           "1/4 cup white vinegar",
//           "1 tablespoon dried oregano",
//           "1 teaspoon ground cumin",
//           "1 ripe pineapple, sliced",
//           "Corn tortillas",
//           "Fresh cilantro and lime for garnish"
//         ],
//         category: "Mexican", 
//         image: "tacos-al-pastor.jpg"
//       },
//       { 
//         name: "Chocolate Lava Cake",
//         description: "A rich and indulgent chocolate cake with a molten center, perfect for dessert lovers.",
//         email: "dessert@recipeblog.com",
//         ingredients: [
//           "200g dark chocolate",
//           "100g butter",
//           "3 eggs",
//           "100g sugar",
//           "50g all-purpose flour",
//           "Powdered sugar for dusting",
//           "Vanilla ice cream for serving"
//         ],
//         category: "American", 
//         image: "chocolate-lava-cake.jpg"
//       },
//       { 
//         name: "Caprese Salad",
//         description: "A fresh and simple Italian salad made with tomatoes, mozzarella, basil, and olive oil.",
//         email: "salad@recipeblog.com",
//         ingredients: [
//           "3 ripe tomatoes, sliced",
//           "200g fresh mozzarella, sliced",
//           "Fresh basil leaves",
//           "2 tablespoons olive oil",
//           "Balsamic vinegar for drizzling",
//           "Salt and pepper to taste"
//         ],
//         category: "Mexican", 
//         image: "caprese-salad.jpg"
//       }
//     ]);
//   } catch (error) {
//     console.log('err', error);
//   }
// }
// insertDymmyRecipeData();

