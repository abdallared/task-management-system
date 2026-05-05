import { supabase } from '../supabase'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns'

export const analyticsApi = {
  // Get group analytics
  getGroupAnalytics: async (groupId) => {
    try {
      // Get all tasks for the group
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(id, user_id),
          task_comments(id),
          task_time_entries(duration)
        `)
        .eq('group_id', groupId)

      if (tasksError) throw tasksError

      // Get group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

      if (membersError) throw membersError

      // Calculate statistics
      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.status === 'done').length
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
      const blockedTasks = tasks.filter(t => t.status === 'blocked').length
      const todoTasks = tasks.filter(t => t.status === 'todo').length

      // Calculate completion rate
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Tasks by priority
      const urgentTasks = tasks.filter(t => t.priority === 'urgent').length
      const highTasks = tasks.filter(t => t.priority === 'high').length
      const mediumTasks = tasks.filter(t => t.priority === 'medium').length
      const lowTasks = tasks.filter(t => t.priority === 'low').length

      // Overdue tasks
      const now = new Date()
      const overdueTasks = tasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < now && 
        t.status !== 'done'
      ).length

      // Tasks completed this week
      const weekStart = startOfWeek(now)
      const weekEnd = endOfWeek(now)
      const completedThisWeek = tasks.filter(t => {
        if (t.status !== 'done' || !t.updated_at) return false
        const updatedDate = new Date(t.updated_at)
        return updatedDate >= weekStart && updatedDate <= weekEnd
      }).length

      // Tasks completed this month
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const completedThisMonth = tasks.filter(t => {
        if (t.status !== 'done' || !t.updated_at) return false
        const updatedDate = new Date(t.updated_at)
        return updatedDate >= monthStart && updatedDate <= monthEnd
      }).length

      // Average time per task (from time entries)
      const totalTime = tasks.reduce((sum, task) => {
        const taskTime = task.task_time_entries?.reduce((tSum, entry) => 
          tSum + (entry.duration || 0), 0
        ) || 0
        return sum + taskTime
      }, 0)
      const avgTimePerTask = completedTasks > 0 ? Math.round(totalTime / completedTasks) : 0

      // Tasks with comments
      const tasksWithComments = tasks.filter(t => t.task_comments?.length > 0).length

      // Team size
      const teamSize = members.length

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        todoTasks,
        completionRate,
        urgentTasks,
        highTasks,
        mediumTasks,
        lowTasks,
        overdueTasks,
        completedThisWeek,
        completedThisMonth,
        avgTimePerTask,
        tasksWithComments,
        teamSize,
        totalTime
      }
    } catch (error) {
      console.error('Error fetching group analytics:', error)
      throw error
    }
  },

  // Get user performance in a group
  getUserPerformance: async (groupId) => {
    try {
      const { data: members, error: membersError } = await supabase
        .rpc('get_group_members_with_emails', { p_group_id: groupId })

      if (membersError) throw membersError

      const performance = await Promise.all(
        members.map(async (member) => {
          // Get tasks assigned to this user
          const { data: assignments, error: assignError } = await supabase
            .from('task_assignments')
            .select(`
              task_id,
              task:tasks(
                id,
                status,
                priority,
                group_id
              )
            `)
            .eq('user_id', member.user_id)

          if (assignError) throw assignError

          // Filter tasks for this group
          const groupTasks = assignments.filter(a => a.task?.group_id === groupId)
          const totalAssigned = groupTasks.length
          const completed = groupTasks.filter(a => a.task?.status === 'done').length
          const inProgress = groupTasks.filter(a => a.task?.status === 'in_progress').length
          const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0

          // Get time entries for this user
          const { data: timeEntries, error: timeError } = await supabase
            .from('task_time_entries')
            .select('duration, task:tasks!inner(group_id)')
            .eq('user_id', member.user_id)
            .eq('task.group_id', groupId)
            .not('duration', 'is', null)

          if (timeError) throw timeError

          const totalTime = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

          return {
            userId: member.user_id,
            name: member.full_name || member.email,
            email: member.email,
            totalAssigned,
            completed,
            inProgress,
            completionRate,
            totalTime
          }
        })
      )

      // Sort by completion rate
      return performance.sort((a, b) => b.completionRate - a.completionRate)
    } catch (error) {
      console.error('Error fetching user performance:', error)
      throw error
    }
  },

  // Get task completion trend (last 7 days)
  getCompletionTrend: async (groupId, days = 7) => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status, updated_at')
        .eq('group_id', groupId)
        .eq('status', 'done')

      if (error) throw error

      const trend = []
      const now = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(now, i)
        const dateStr = format(date, 'MMM d')
        
        const count = tasks.filter(t => {
          if (!t.updated_at) return false
          const updatedDate = new Date(t.updated_at)
          return format(updatedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        }).length

        trend.push({
          date: dateStr,
          count
        })
      }

      return trend
    } catch (error) {
      console.error('Error fetching completion trend:', error)
      throw error
    }
  },

  // Get activity summary
  getActivitySummary: async (groupId, days = 7) => {
    try {
      const startDate = subDays(new Date(), days)

      // Get recent activity from activity_log
      const { data: activities, error } = await supabase
        .from('activity_log')
        .select('action, created_at')
        .eq('group_id', groupId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const summary = {
        totalActivities: activities.length,
        taskCreated: activities.filter(a => a.action === 'task_created').length,
        taskUpdated: activities.filter(a => a.action === 'task_updated').length,
        taskCompleted: activities.filter(a => a.action === 'task_completed').length,
        commentAdded: activities.filter(a => a.action === 'comment_added').length
      }

      return summary
    } catch (error) {
      console.error('Error fetching activity summary:', error)
      return {
        totalActivities: 0,
        taskCreated: 0,
        taskUpdated: 0,
        taskCompleted: 0,
        commentAdded: 0
      }
    }
  }
}
