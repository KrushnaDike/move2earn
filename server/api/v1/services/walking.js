import Walking from "../../../models/walking";
import Shoe from "../../../models/shoes";

const walkingServices = {
  calculateWalkingPoints: async (distanceInKm, shoePoints) => {
    const pointsEarned = distanceInKm * shoePoints;
    return pointsEarned;
  },

  checkUserActivityExists: async (userId) => {
    return await Walking.find({ userId })
      .populate("resourceId") // Populate the resourceId field with Shoe details
      .exec();
  },

  checkActivityExists: async (activityId) => {
    return await Walking.findById({ _id: activityId })
      .populate("resourceId") // Populate the resourceId field with Shoe details
      .exec();
  },

  updateActivity: async (activityId, validatedBody) => {
    return await Walking.findByIdAndUpdate(activityId, validatedBody, {
      new: true,
    });
  },

  deleteActivity: async (activityId) => {
    return await Walking.findByIdAndDelete(activityId);
  },

  findShoe: async (selectedShoeId) => {
    return await Shoe.findById(selectedShoeId);
  },
};

module.exports = { walkingServices };
