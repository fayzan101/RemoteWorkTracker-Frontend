import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "./notifications.service";
import type { NotificationFilters } from "@/types";

const QUERY_KEYS = {
  list: (filters?: NotificationFilters) => ["notifications", filters],
};

export function useNotificationsList(filters?: NotificationFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => notificationsService.list(filters),
    staleTime: 1000 * 60 * 1, // 1 minute for real-time feel
  });
}

export function useMarkNotificationAsRead(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => {
      const nextId = notificationId || id;
      if (!nextId) throw new Error("notificationId is required");
      return notificationsService.markAsRead(nextId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => {
      const nextId = notificationId || id;
      if (!nextId) throw new Error("notificationId is required");
      return notificationsService.delete(nextId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
