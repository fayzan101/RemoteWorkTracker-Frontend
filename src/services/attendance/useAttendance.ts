import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "./attendance.service";
import type { AttendanceFilters } from "@/types";

const QUERY_KEYS = {
  listAll: (filters?: AttendanceFilters) => ["attendance", "all", filters],
  listMy: (filters?: AttendanceFilters) => ["attendance", "me", filters],
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
