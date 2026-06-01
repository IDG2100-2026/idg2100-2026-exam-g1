import cron from "node-cron";
import User from "../Models/User.model.js";
import { WEEKLY_POINTS } from "../Config/Constants.js";

const weeklyPoints = () => {
  cron.schedule("0 0 * * 1", async () => {
    try {
      await User.updateMany({}, { $inc: { points: WEEKLY_POINTS } });
      console.log(`Weekly points distributed: +${WEEKLY_POINTS} to all users`);
    } catch (err) {
      console.error("weekly points job failed:", err);
    }
  });
};

export default weeklyPoints;
