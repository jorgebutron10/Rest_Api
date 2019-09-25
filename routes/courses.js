const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { Course } = require('../models');
const authenticateUser = require('./authentication');

// ASYNC HANDLER
  function asyncHandler(cb) {
    return async (req, res, next) => {
        try {
            await cb(req, res, next);
        } catch(err) {
            next(err);
        }
    }
}

router.get('/', asyncHandler(async(req, res, next) => {
    Course.findAll({
        order: [["id", "ASC"]],
        attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId']
    })
    .then(courses => {
        res.json({ courses });
    })
  }))

// router GET
  router.get('/:id', asyncHandler(async(req, res, next) => {
    Course.findOne({
      attributes: ['id', 'userId', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
      where: {
        id: req.params.id
      }
    }).then(course => {
      if(course) {
        res.json({ course })
      } else {
        res.status(404).json({ message: 'Route not found' });
      }
    })
  }))

// router post

  router.post('/', [
    check('title').exists().withMessage('Please provide a value for title'),
    check('description').exists().withMessage('Please provide a value for description')
  ], authenticateUser, asyncHandler(async(req, res, next)=> {
    const user = req.currentUser.id;

    // validation result
    const errors = validationResult(req);

     // validation errors
     if (!errors.isEmpty()) {

         // list of error messages
         const errorMessages = errors.array().map(error => error.msg);

          // validation client side
         res.status(400).json({ errors: errorMessages });
     } else {

        // new course
        await Course.create({ ...req.body, userId: user })
        .then((course) => {
            if (course) {
                res.status(201).location(`/api/courses/${course.id}`).end();
            } else {
                next();
            }
        })
     }
  }))

  router.put('/:id', [
    check('title').exists().withMessage('Please provide a value for title'),
    check('description').exists().withMessage('Please provide a value for description')
  ], authenticateUser, asyncHandler(async(req, res, next) => {
    const user = req.currentUser.id;


    const errors = validationResult(req);

     // errors
     if (!errors.isEmpty()) {

         // map() goes through the list in the array a prints out message
         const errorMessages = errors.array().map(error => error.msg);

         // validation returned / error 404
         res.status(400).json({ errors: errorMessages });
        } else {
            await Course.findOne({
              where: [{ id: req.params.id }]
            })
            .then((course) => {

                // if you select  a user to update
                if (course.userId === user) {
                    if (course) {
                        course.update(req.body);
                        res.status(204).end();
                    } else {
                      next();
                    }
                } else {
                  res.status(403).json({ message: "Current User doesn't own the requested course" }).end();
                }
            })
        }
    }))

  // router delete
  router.delete('/:id', authenticateUser, asyncHandler(async (req, res, next)=> {
    const user = req.currentUser.id;

    await Course.findOne({
      where: [{ id: req.params.id }]
    })
    .then((course) => {
         // If user has the selected course delete it
            if (course.userId === user) {
              if (course) {
                course.destroy();
                res.status(204).end();
            } else {
              next();
            }
         } else {
          res.status(403).json({ message: "Current User doesn't own the requested course" }).end();
         }
      })
  }))

  module.exports = router;
