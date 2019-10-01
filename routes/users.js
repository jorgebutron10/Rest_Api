const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const {  User } = require('../models');
const authenticateUser = require('./authentication');

// async handler
  function asyncHandler(cb) {
    return async (req, res, next) => {
        try {
            await cb(req, res, next);
        } catch(err) {
            next(err);
        }
    }
}

// authenticated user
router.get('/', authenticateUser, asyncHandler(async(req, res, next) => {
    const user = await req.currentUser;
    res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
    });
    res.status(200);
    res.end();
}));

// Location header to "/"
router.post('/', [
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for first name'),
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for last name'),
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for email address'),
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for password'),
], asyncHandler(async (req, res, next) => {

    // Attempts to get the validation
  const errors = validationResult(req);

  // If, validation errors
    if (!errors.isEmpty()) {

  // error message
      const errorMessages = errors.array().map(error => error.msg);

  // return error to client
          res.status(400).json({ errors: errorMessages });
        } else {
  // Get the user from the request body.
          const user = req.body;

  // secret password incrypted
        user.password = bcryptjs.hashSync(user.password);

        // Creating a new user
          await User.create(user)
            .then(user=> {

      // Set location to '/' route (the root route)
              res.location = '/';

      // Set the status to 201
              res.status(201).end();
            })
          }
        })
      )


      module.exports = router;
