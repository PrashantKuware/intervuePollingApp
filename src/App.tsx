import React from 'react';
import { PollProvider, usePoll } from './context/PollContext';
import { RoleSelection } from './components/RoleSelection';
import { StudentNameInput } from './components/StudentNameInput';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';

const AppContent: React.FC = () => {
  const { state } = usePoll();

  // Role selection screen - show until role is selected AND confirmed
  if (!state.userRole || !state.roleConfirmed) {
    return <RoleSelection />;
  }

  // Student flow
  if (state.userRole === 'student') {
    if (!state.studentName) {
      return <StudentNameInput />;
    }
    return <StudentDashboard />;
  }

  // Teacher flow
  if (state.userRole === 'teacher') {
    return <TeacherDashboard />;
  }

  return <RoleSelection />;
};

export const App: React.FC = () => {
  return (
    <PollProvider>
      <AppContent />
    </PollProvider>
  );
};