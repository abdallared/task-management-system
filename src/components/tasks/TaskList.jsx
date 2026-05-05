import TaskCard from './TaskCard'

export default function TaskList({ tasks, groupId }) {
  if (tasks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No tasks yet. Create your first task to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} groupId={groupId} />
      ))}
    </div>
  )
}
