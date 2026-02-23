import activity from "@/lib/mock/activity.json";
import channels from "@/lib/mock/channels.json";
import payouts from "@/lib/mock/payouts.json";
import users from "@/lib/mock/users.json";
import videos from "@/lib/mock/videos.json";
import type {
  ActivityItem,
  ChannelApproval,
  PayoutRequest,
  UserRow,
  VideoItem,
} from "@/lib/types";

export const mockVideos = videos as VideoItem[];
export const mockActivity = activity as ActivityItem[];
export const mockUsers = users as UserRow[];
export const mockChannels = channels as ChannelApproval[];
export const mockPayoutRequests = payouts as PayoutRequest[];
