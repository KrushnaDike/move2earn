import Mongoose, { Schema } from "mongoose";

var cyclingModel = new Schema(
  {
    userId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resourceId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "Cycle",
      required: true,
    },

    distanceInKm: {
      type: Number,
      required: true,
    },

    timeInMinutes: {
      type: Number,
      required: true,
    },

    // Add More
    pointsEarned: {
      type: Number, // Field to store points earned for cycling activity
      default: 0, // Default value for points earned
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Cycling", cyclingModel);
