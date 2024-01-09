import Running from "../../../models/running";
import Shoe from "../../../models/shoes";

const runningServices = {
  calculateRunningPoints: async (distanceInKm) => {
    const runningPointsConversion = 8; // points per km for walking
    return distanceInKm * runningPointsConversion;
  },

  checkUserActivityExists: async (userId) => {
    return await Running.find({ userId })
      .populate("resourceId") // Populate the resourceId field with Shoe details
      .exec();
  },

  checkActivityExists: async (activityId) => {
    return await Running.findById({ _id: activityId })
      .populate("resourceId") // Populate the resourceId field with Shoe details
      .exec();
  },

  updateActivity: async (activityId, validatedBody) => {
    return await Running.findByIdAndUpdate(activityId, validatedBody, {
      new: true,
    });
  },

  deleteActivity: async (activityId) => {
    return await Running.findByIdAndDelete(activityId);
  },

  findShoe: async (selectedShoeId) => {
    return await Shoe.findById(selectedShoeId);
  },
};

module.exports = { runningServices };
