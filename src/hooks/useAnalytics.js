import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../services/api/analytics'

export const useAnalytics = (groupId) => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', groupId],
    queryFn: () => analyticsApi.getGroupAnalytics(groupId),
    enabled: !!groupId,
    staleTime: 60000, // 1 minute
  })

  const { data: userPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['userPerformance', groupId],
    queryFn: () => analyticsApi.getUserPerformance(groupId),
    enabled: !!groupId,
    staleTime: 60000,
  })

  const { data: completionTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['completionTrend', groupId],
    queryFn: () => analyticsApi.getCompletionTrend(groupId, 7),
    enabled: !!groupId,
    staleTime: 60000,
  })

  const { data: activitySummary, isLoading: activityLoading } = useQuery({
    queryKey: ['activitySummary', groupId],
    queryFn: () => analyticsApi.getActivitySummary(groupId, 7),
    enabled: !!groupId,
    staleTime: 60000,
  })

  return {
    analytics,
    userPerformance,
    completionTrend,
    activitySummary,
    isLoading: analyticsLoading || performanceLoading || trendLoading || activityLoading
  }
}
