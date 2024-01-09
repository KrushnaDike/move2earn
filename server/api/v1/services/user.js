import userModel from "../../../models/user";
import Notify from "../../../models/notifications";
import status from "../../../enums/status";
import userType from "../../../enums/userType";

const userServices = {
  userCheck: async (userId) => {
    let query = {
      $and: [
        { status: { $ne: status.DELETE } },
        { $or: [{ email: userId }, { mobileNumber: userId }] },
      ],
    };
    return await userModel.findOne(query);
  },

  // USED
  deleteUser: async (query) => {
    return await userModel.deleteOne(query);
  },

  checkUserExists: async (mobileNumber, email) => {
    let query = {
      $and: [
        { status: { $ne: status.DELETE } },
        { $or: [{ email: email }, { mobileNumber: mobileNumber }] },
      ],
    };
    return await userModel.findOne(query);
  },

  emailMobileExist: async (email, mobileNumber) => {
    let query = {
      $and: [
        {
          status: { $ne: status.DELETE },
          userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
        },
        { $or: [{ email: email }, { mobileNumber: mobileNumber }] },
      ],
    };
    return await userModel.findOne(query);
  },

  emailMobileExist: async (mobileNumber, email, id) => {
    let query = {
      $and: [
        { status: { $ne: status.DELETE } },
        { _id: { $ne: id } },
        { $or: [{ email: email }, { mobileNumber: mobileNumber }] },
      ],
    };
    return await userModel.findOne(query);
  },

  // USED
  createUser: async (insertObj) => {
    return await userModel.create(insertObj);
  },

  // USED
  findUser: async (query) => {
    return await userModel.findOne(query);
  },

  // USED
  findUser1: async (query) => {
    return await userModel.findOne(query);
  },
  findCount: async (query) => {
    return await userModel.count(query);
  },

  // USED
  updateUser: async (query, updateObj) => {
    return await userModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  // USED
  updateUserById: async (query, updateObj) => {
    return await userModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  insertManyUser: async (obj) => {
    return await userModel.insertMany(obj);
  },

  findAllNotifications: async (userId) => {
    return await Notify.find({ userId });
  }
};

module.exports = { userServices };
