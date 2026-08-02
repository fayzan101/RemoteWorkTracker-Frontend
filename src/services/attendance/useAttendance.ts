import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "./attendance.service";
import type { AttendanceFilters, CreateGeoFencePayload } from "@/types";

const QUERY_KEYS = {
  listAll: (filters?: AttendanceFilters) => ["attendance", "all", filters],
  listMy: (filters?: AttendanceFilters) => ["attendance", "me", filters],
  geoFences: ["attendance", "geo-fences"],
};

export function useAttendanceListAll(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.listAll(filters),
    queryFn: () => attendanceService.listAll(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAttendanceListMy(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.listMy(filters),
    queryFn: () => attendanceService.listMy(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGeoFencesList() {
  return useQuery({
    queryKey: QUERY_KEYS.geoFences,
    queryFn: () => attendanceService.listGeoFences(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGeoFence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGeoFencePayload) => attendanceService.createGeoFence(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geoFences });
    },
  });
}

export function useDeleteGeoFence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceService.deleteGeoFence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geoFences });
    },
  });
}

export function useAttendanceCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      latitude: number;
      longitude: number;
      ipAddress: string;
      deviceId?: string;
    }) => attendanceService.checkIn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useAttendanceCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { sessionId: string; deviceId?: string }) =>
      attendanceService.checkOut(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
