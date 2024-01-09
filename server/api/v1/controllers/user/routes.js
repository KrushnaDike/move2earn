import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .post('/userSignUp', controller.userSignUp)
    .post('/verifyOTP', controller.verifyOTP)
    .post('/resendOTP', controller.resendOTP)

    .post('/forgotPassword', controller.forgotPassword)
    .post('/resetPassword', controller.resetPassword)
    .post('/userLogin', controller.userLogin)
    .get("/userLogout", controller.userLogout)

    .use(auth.verifyToken)
    .post('/changePassword', controller.changePassword)
    .get('/getProfile', controller.getProfile)
    .delete('/deleteMyProfile', controller.deleteMyProfile)
    .put('/updateUser', controller.updateUser)
    .get("/getAllNotifications", controller.getAllNotifications)

    .use(upload.uploadFile)
    .put('/editUserProfile', controller.editUserProfile);
