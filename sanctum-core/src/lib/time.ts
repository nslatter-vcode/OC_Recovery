import { DateTime } from "luxon";

export const CHICAGO_ZONE = "America/Chicago";

export const nowCst = () => DateTime.now().setZone(CHICAGO_ZONE);
export const startOfTodayCst = () => nowCst().startOf("day");
export const startOfYesterdayCst = () => startOfTodayCst().minus({ days: 1 });
