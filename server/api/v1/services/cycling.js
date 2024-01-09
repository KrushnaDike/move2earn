import Cycling from "../../../models/cycling";
import Cycle from "../../../models/cycle";

const cyclingServices = {
  calculateCyclingPoints: async (distanceInKm) => {
    const cyclingPointsConversion = 10; // points per km for walking
    return distanceInKm * cyclingPointsConversion;
  },

  checkUserActivityExists: async (userId) => {
    return await Cycling.find({ userId })
      .populate("resourceId") // Populate the resourceId field with Shoe details
      .exec();
  },

  checkActivityExists: async (activityId) => {
    return await Cycling.findById({ _id: activityId })
      .populate("resourceId") // Populate the resourceId field with Shoe details
      .exec();
  },

  updateActivity: async (activityId, validatedBody) => {
    return await Cycling.findByIdAndUpdate(activityId, validatedBody, {
      new: true,
    });
  },

  deleteActivity: async (activityId) => {
    return await Cycling.findByIdAndDelete(activityId);
  },

  findCycle: async (selectedCycleId) => {
    return await Cycle.findById(selectedCycleId);
  },
};

module.exports = { cyclingServices };
