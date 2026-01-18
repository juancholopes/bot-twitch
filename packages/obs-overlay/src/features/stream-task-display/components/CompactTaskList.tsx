import { useEffect, useMemo, useRef } from 'react';
import AnimatedTaskItem from './AnimatedTaskItem';
import type { UserTasks, Task } from '@bot-twitch/shared/task';

// Maximum number of tasks that fit in viewport before enabling infinite scroll
const MAX_VISIBLE_TASKS = 10;

interface CompactTaskListProps {
  tasks?: UserTasks[];
  loading?: boolean;
  connected?: boolean;
}

const CompactTaskList: React.FC<CompactTaskListProps> = ({ 
  tasks = [], 
  loading = false 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalTasks = useMemo(() => {
    return tasks.reduce((total, user) => {
      return total + (user.task?.length || 0) + (user.completed?.length || 0);
    }, 0);
  }, [tasks]);

  const displayTasks = useMemo(() => {
    if (!tasks.length) return [];

    const userGroups: Record<string, { pending: Task[]; completed: Task[] }> = {};
    tasks.forEach((user) => {
      if (!userGroups[user.user])
        userGroups[user.user] = { pending: [], completed: [] };

      user.task?.forEach((task, idx) => {
        if (task && task.trim()) {
          userGroups[user.user].pending.push({
            id: `${user.user}-${task}-pending-${idx}`,
            text: task,
            username: user.user,
            completed: false,
            timestamp: idx,
          });
        }
      });

      user.completed?.forEach((task, idx) => {
        if (task && task.trim()) {
          userGroups[user.user].completed.push({
            id: `${user.user}-${task}-completed-${idx}`,
            text: task,
            username: user.user,
            completed: true,
            timestamp: idx + (user.task?.length || 0),
          });
        }
      });
    });

    const sortedUsernames = Object.keys(userGroups).sort();
    const allTasks: Task[] = [];
    sortedUsernames.forEach((username) => {
      const group = userGroups[username];
      allTasks.push(...group.pending);
      allTasks.push(...group.completed);
    });

    const isInfinite = totalTasks > MAX_VISIBLE_TASKS;

    if (isInfinite) {
      const repeatedTasks: Task[] = [];
      for (let i = 0; i < 20; i++) {
        allTasks.forEach((task, index) => {
          repeatedTasks.push({
            ...task,
            id: `${task.id}-${i}-${index}`,
          });
        });
      }
      return repeatedTasks;
    }
    return allTasks;
  }, [tasks, totalTasks]);

  useEffect(() => {
    const isInfinite = totalTasks > MAX_VISIBLE_TASKS;
    if (!isInfinite || !displayTasks.length || !scrollContainerRef.current)
      return;

    const container = scrollContainerRef.current;
    let animationId: number;

    const autoScroll = () => {
      if (container) {
        container.scrollTop += 1;

        if (
          container.scrollTop >=
          container.scrollHeight - container.clientHeight - 10
        ) {
          container.scrollTop = container.scrollHeight / 3;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [displayTasks, totalTasks]);

  if (loading) {
    return (
      <div className="pointer-events-none fixed bottom-5 right-5 h-[400px] w-[320px] animate-slideIn z-[1000]">
        <div className="pointer-events-none absolute inset-0 -left-3 -right-3 rounded-xl border border-white/20 bg-[rgba(15,15,20,0.85)] backdrop-blur-[16px] saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]" />
        <div className="relative z-10 border-b border-white/20 px-5 pb-3 pt-4">
          <h2 className="m-0 text-[16px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Loading tasks...</h2>
        </div>
      </div>
    );
  }

  if (!displayTasks.length) {
    return (
      <div className="pointer-events-none fixed bottom-5 right-5 h-[400px] w-[320px] animate-slideIn z-[1000]">
        <div className="pointer-events-none absolute inset-0 -left-3 -right-3 rounded-xl border border-white/20 bg-[rgba(15,15,20,0.85)] backdrop-blur-[16px] saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]" />
        <div className="relative z-10 border-b border-white/20 px-5 pb-3 pt-4">
          <h2 className="m-0 text-[16px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            No tasks yet
            <span className="ml-2 text-[12px] font-normal text-white/70">Use !task to add tasks</span>
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 h-[400px] w-[320px] animate-slideIn z-[1000]">
      <div className="pointer-events-none absolute inset-0 -left-3 -right-3 rounded-xl border border-white/20 bg-[rgba(15,15,20,0.85)] backdrop-blur-[16px] saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]" />
      <div className="relative z-10 border-b border-white/20 px-5 pb-3 pt-4">
        <h2 className="m-0 text-[16px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          Task List
          <span className="ml-2 text-[12px] font-normal text-white/70">({totalTasks} tasks)</span>
        </h2>
      </div>
      <div
        ref={scrollContainerRef}
        className="relative z-10 overflow-hidden rounded-b-xl"
        style={{ height: 'calc(100% - 60px)' }}
      >
        <div className="py-2">
          {displayTasks.map((task, index) => (
            <AnimatedTaskItem key={task.id} task={task} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactTaskList;
