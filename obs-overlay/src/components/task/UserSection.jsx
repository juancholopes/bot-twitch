import styled from 'styled-components';
import TaskItem from './TaskItem';

const Section = styled.div`
  margin: 20px 0;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
`;

const Username = styled.h2`
  font-family: 'Courier New', monospace;
  color: white;
  text-transform: uppercase;
  margin-bottom: 10px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserSection = ({ user }) => {
  const allTasks = [
    ...user.task.map(task => ({ text: task, completed: false })),
    ...user.completed.map(task => ({ text: task, completed: true }))
  ];

  return (
    <Section>
      <Username>{user.user}</Username>
      <TaskList>
        {allTasks.map((task, index) => (
          <TaskItem key={index} task={task.text} index={index} completed={task.completed} />
        ))}
      </TaskList>
    </Section>
  );
};

export default UserSection;