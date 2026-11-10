import base from "./razorpay-worker.js";
import { withSearchVisibility } from "./search-visibility.js";

import { withFrames } from "./frames-worker.js";

export default withFrames(withSearchVisibility(base));
