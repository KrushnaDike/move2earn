// importing model
import Cycling from "../../../models/cycling";
import Running from "../../../models/running";
import Walking from "../../../models/walking";

const earningServices = {
  checkUserCyclingActivitiesExists: async (userId) => {
    return await Cycling.find({ userId });
  },
  checkUserRunningActivitiesExists: async (userId) => {
    return await Running.find({ userId });
  },
  checkUserWalkingActivitiesExists: async (userId) => {
    return await Walking.find({ userId });
  },
};

module.exports = { earningServices };
