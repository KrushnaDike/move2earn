import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import speakeasy from "speakeasy";
import userType from "../../../../enums/userType";
const secret = speakeasy.generateSecret({ length: 10 });

import { userServices } from "../../services/user";
const {
  userCheck,
  paginateSearch,
  insertManyUser,
  createAddress,
  checkUserExists,
  emailMobileExist,
  createUser,
  findUser,
  updateUser,
  deleteUser,
  updateUserById,
  checkSocialLogin,
  findUser1,
} = userServices;

// const notifications = require('../../../../helper/notification')

export class userController {
  /**
   * @swagger
   * /user/userSignUp:
   *   post:
   *     summary: User Signup
   *     tags:
   *       - USER
   *     description: userSignUp
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: userSignUp
   *         description: userSignUp
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/userSignup'
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async userSignUp(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().required(),
      countryCode: Joi.string().required(),
      mobileNumber: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.body);

      const {
        email,
        mobileNumber,
        password,
        confirmPassword,
        otp,
        otpExpireTime,
      } = validatedBody;

      validatedBody.otp = commonFunction.getOTP();
      validatedBody.otpExpireTime = Date.now() + 180000; // expire after 3 min
      validatedBody.password = bcrypt.hashSync(validatedBody.password);

      //   USER EXISTS OR NOT
      var userInfo = await checkUserExists(mobileNumber, email);
      if (userInfo) {
        if (userInfo.otpVerified == true) {
          if (userInfo.mobileNumber == mobileNumber) {
            throw apiError.conflict(responseMessage.MOBILE_EXIST);
          } else {
            throw apiError.conflict(responseMessage.EMAIL_EXIST);
          }
        }
      }

      //   PASSWORD CHECK
      if (password != req.body.confirmPassword) {
        throw apiError.conflict("Password and confirm password does not match");
      }

      //   SEND VERIFICATION OTP
      await commonFunction.sendEmailOtp(email, validatedBody.otp);
      if (userInfo) {
        let updateRes = await updateUser({ _id: userInfo._id }, validatedBody);
        return res.json(new response(updateRes, responseMessage.USER_CREATED));
      }

      var result = await createUser(validatedBody);
      return res.json(new response(result, responseMessage.USER_CREATED));
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/verifyOTP:
   *   post:
   *     summary: Verify User OTP
   *     tags:
   *       - USER
   *     description: verifyOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async verifyOTP(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().required(),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.body);
      const { email, otp } = validatedBody;

      const userResult = await findUser({ email: email });

      if (!userResult) {
        throw new Error(responseMessage.USER_NOT_FOUND);
      } else {
        if (Date.now() > userResult.otpExpireTime) {
          throw new Error(responseMessage.OTP_EXPIRED);
        }
        if (userResult.otp !== otp) {
          throw new Error(responseMessage.INCORRECT_OTP);
        }

        const updateResult = await updateUser(
          { _id: userResult._id },
          { otpVerified: true }
        );
        return res.json(
          new response(updateResult, responseMessage.OTP_VERIFIED)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resendOTP:
   *   post:
   *     summary: User resendOTP
   *     tags:
   *       - USER
   *     description: resendOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resendOTP
   *         description: resendOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resendOTP'
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async resendOTP(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().required(),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.body);
      const { email } = validatedBody;

      var userResult = await findUser({
        $or: [{ email: email }, { mobileNumber: email }],
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        let otp = await commonFunction.getOTP();
        let otpExpireTime = Date.now() + 180000;

        if (userResult.email == email) {
          await commonFunction.sendEmailOtp(email, otp);
        }

        var updateResult = await updateUser(
          { _id: userResult._id },
          { otp: otp, otpExpireTime: otpExpireTime }
        );
        return res.json(new response({}, responseMessage.OTP_SENT));
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/forgotPassword:
   *   post:
   *     summary: User Forgot Password
   *     tags:
   *       - USER
   *     description: forgotPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: forgotPassword
   *         description: forgotPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/forgotPassword'
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async forgotPassword(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().required(),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.body);
      const { email } = validatedBody;

      var userResult = await findUser({
        $or: [{ email: email }, { mobileNumber: email }],
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        let otp = await commonFunction.getOTP();
        let otpExpireTime = Date.now() + 180000;

        if (userResult.email == email) {
          await commonFunction.sendEmailOtp(email, otp);
        }

        var updateResult = await updateUser(
          { _id: userResult._id },
          { otp: otp, otpExpireTime: otpExpireTime }
        );

        return res.json(new response(updateResult, responseMessage.OTP_SENT));
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resetPassword:
   *   post:
   *     summary: User resetPassword
   *     tags:
   *       - USER
   *     description: resetPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: newPassword
   *         description: newPassword
   *         in: formData
   *         required: false
   *       - name: confirmPassword
   *         description: confirmPassword
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async resetPassword(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().required(),
      newPassword: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.body);

      let userInfo = await findUser({ email: validatedBody.email });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (validatedBody.newPassword != validatedBody.confirmPassword) {
        throw apiError.notFound(responseMessage.PASSWORD_NOT_MATCHED);
      }

      let updateResult = await updateUser(
        { _id: userInfo._id },
        { password: bcrypt.hashSync(validatedBody.newPassword) }
      );

      return res.json(
        new response(updateResult, responseMessage.PASSWORD_RESET)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/changePassword:
   *   post:
   *     summary: change password by user
   *     tags:
   *       - USER
   *     description: Change Password by user
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: oldPassword
   *         description: oldPassword
   *         in: formData
   *         required: true
   *       - name: newPassword
   *         description: newPassword
   *         in: formData
   *         required: true
   *       - name: confirmPassword
   *         description: confirmPassword
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async changePassword(req, res, next) {
    const validationSchema = Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.body);

      let userInfo = await findUser({ _id: req.userId });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (validatedBody.newPassword != validatedBody.confirmPassword) {
        throw apiError.notFound(responseMessage.PASSWORD_NOT_MATCHED);
      }

      if (!bcrypt.compareSync(validatedBody.oldPassword, userInfo.password)) {
        throw apiError.notFound(responseMessage.OLD_PASSWORD_NOT_MATCHED);
      }

      let updateResult = await updateUser(
        { _id: userInfo._id },
        { password: bcrypt.hashSync(validatedBody.newPassword) }
      );

      return res.json(
        new response(updateResult, responseMessage.PASSWORD_CHANGED)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/userLogin:
   *   post:
   *     summary: User login
   *     tags:
   *       - USER
   *     description: userLogin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: userLogin
   *         description: userLogin
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/userLogin'
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async userLogin(req, res, next) {
    let validationSchema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    try {
      let obj;
      let validatedBody = await validationSchema.validateAsync(req.body);
      const { email, password } = validatedBody;

      var userResult = await findUser({
        email: email,
        status: { $ne: status.DELETE },
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else if (userResult.status == status.BLOCK) {
        throw apiError.notFound(responseMessage.USER_BLOCKED_ADMIN);
      }

      let Check = bcrypt.compareSync(password, userResult.password);
      console.log("==================>", Check);
      if (Check == false) {
        throw apiError.invalid(responseMessage.INCORRECT_LOGIN);
      }

      if (userResult.otpVerified == false) {
        return res.json(new response(obj, responseMessage.USER_NOT_VERIFIED));
      } else {
        let token = await commonFunction.getToken({
          _id: userResult._id,
          email: userResult.email,
          userType: userResult.userType,
        });
        obj = {
          _id: userResult._id,
          email: userResult.email,
          userType: userResult.userType,
          otpVerification: userResult.otpVerified,
          token: token,
        };
        return res.json(new response(obj, responseMessage.LOGIN));
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/userLogout:
   *   get:
   *     summary: User logout
   *     tags:
   *       - USER
   *     description: userLogout
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: User token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Logout successfully.
   *       404:
   *         description: Incorrect login credential provided.
   *       501:
   *         description: User not found.
   */
  async userLogout(req, res, next) {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        // secure: true,
        sameSite: "none",
      })
      .json({
        success: true,
        message: "Logged out Successfully",
      });
  }

  /**
   * @swagger
   * /user/getProfile:
   *   get:
   *     summary: User getProfile
   *     tags:
   *       - USER
   *     description: getProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: User token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Login successfully.
   *       404:
   *         description: Incorrect login credential provided.
   *       501:
   *         description: User not found.
   */
  async getProfile(req, res, next) {
    try {
      let userResult = await findUser1({
        _id: req.userId,
        userType: { $in: [userType.USER, userType.EXPERT, userType.AGENT] },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      return res.json(new response(userResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/editUserProfile:
   *   put:
   *     summary: User editProfile
   *     tags:
   *       - USER
   *     description: editUserProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: false
   *       - name: surName
   *         description: surName
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: profilePic
   *         description: profilePic
   *         in: formData
   *         type: file
   *         required: false
   *       - name: bio
   *         description: bio
   *         in: formData
   *         required: false
   *       - name: weight
   *         description: wight
   *         in: formData
   *         required: false
   *       - name: height
   *         description: height
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async editUserProfile(req, res, next) {
    let validationSchema = Joi.object({
      firstName: Joi.string().optional(),
      surName: Joi.string().optional(),
      email: Joi.string().optional(),
      profilePic: Joi.string().optional(),
      bio: Joi.string().optional(),
      weight: Joi.string().optional(),
      height: Joi.string().optional(),
      gender: Joi.string().optional(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.body);

      let userResult = await findUser({
        _id: req.userId,
        userType: userType.USER,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      //   Profile Pic
      //   if (req.files && req.files.length != 0) {
      //     let imgUrl1 = await commonFunction.getImageUrl(req.files[0].path);
      //     validatedBody.profilePic = imgUrl1.url;
      //   }

      let updateResult = await updateUser({ _id: req.userId }, validatedBody);
      return res.json(new response(updateResult, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/updateUser:
   *   put:
   *     summary: Update user weight, height & location
   *     tags:
   *       - USER
   *     description: Update user weight, height, and location
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: Token
   *         in: header
   *         required: true
   *       - name: weight
   *         description: Weight
   *         in: formData
   *         required: true
   *       - name: height
   *         description: Height
   *         in: formData
   *         required: true
   *       - name: location
   *         description: Location coordinates [latitude, longitude]
   *         in: formData
   *         required: true
   *         schema:
   *           type: array
   *           items:
   *             type: number
   *           minItems: 2
   *           maxItems: 2
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async updateUser(req, res, next) {
    let validationSchema = Joi.object({
      weight: Joi.string().required(),
      height: Joi.string().required(),
      location: Joi.array().items(Joi.number()).min(2).max(2).required(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.body);

      let userResult = await findUser({
        _id: req.userId,
        userType: userType.USER,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      let updateResult = await updateUser({ _id: req.userId }, validatedBody);
      return res.json(new response(updateResult, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/deleteMyProfile:
   *   delete:
   *     summary: Delete user's profile
   *     tags:
   *       - USER
   *     description: Delete the user's profile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: Token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async deleteMyProfile(req, res, next) {
    try {
      const userResult = await findUser({
        _id: req.userId,
        userType: userType.USER,
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      // Delete the user
      const deleteResult = await deleteUser({ _id: req.userId });

      return res.json(new response(deleteResult, responseMessage.USER_DELETED));
    } catch (error) {
      return next(error);
    }
  }
}

export default new userController();
