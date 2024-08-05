const express = require("express");
const router = express.Router();

const {
  signUp,
  login,
  verifyUser,
  saveChat,
  deleteChat,
  editChat,
  updateProfile,
} = require("./../Controllers/C_user");


router.get('/signup', (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  }
  else {
    res.render('sign_up', { notification: "", mcolor: "", formData: "" });
  }
});

// router.post('/signup',signUp)

// router.post('/signup', signUp);
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  }
  else {
    res.render('login', { notification: "", mcolor: "" });
  }
});
router.post('/login', login);
router.get('/', verifyUser);

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login')
});


router.post('/savechat', saveChat);

router.post('/deletechat', deleteChat);
router.post('/editchat', editChat);

router.post('/updateProfile', updateProfile);

module.exports = router;