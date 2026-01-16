import { useEffect, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import AnimatedTaskItem from './AnimatedTaskItem';
import type { UserTasks, Task } from '@bot-twitch/shared/task';

// Maximum number of tasks that fit in viewport before enabling infinite scroll
const MAX_VISIBLE_TASKS = 10;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  height: 400px;
  z-index: 1000;
  animation: ${slideIn} 0.5s ease-out;
  pointer-events: none;
`;

const BlurredBackground = styled.div`
  position: absolute;
  top: 0px;
  left: -12px;
  right: -12px;
  bottom: 0px;
  background: rgba(15, 15, 20, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: none;
  z-index: 1;
`;

const Header = styled.div`
  position: relative;
  z-index: 2;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
`;

const Title = styled.h2`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
`;

const TaskCount = styled.span`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 8px;
  pointer-events: none;
`;

const ScrollContainer = styled.div`
  position: relative;
  z-index: 3;
  height: calc(100% - 60px);
  overflow: hidden;
  pointer-events: none;
  border-radius: 0 0 12px 12px;
`;

const TaskList = styled.div`
  padding: 8px 0;
`;

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
      <Container>
        <BlurredBackground />
        <Header>
          <Title>Loading tasks...</Title>
        </Header>
      </Container>
    );
  }

  if (!displayTasks.length) {
    return (
      <Container>
        <BlurredBackground />
        <Header>
          <Title>No tasks yet</Title>
          <TaskCount>Use !task to add tasks</TaskCount>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <BlurredBackground />
      <Header>
        <Title>
          Task List
          <TaskCount>({totalTasks} tasks)</TaskCount>
        </Title>
      </Header>
      <ScrollContainer ref={scrollContainerRef}>
        <TaskList>
          {displayTasks.map((task, index) => (
            <AnimatedTaskItem key={task.id} task={task} index={index} />
          ))}
        </TaskList>
      </ScrollContainer>
    </Container>
  );
};

export default CompactTaskList;
