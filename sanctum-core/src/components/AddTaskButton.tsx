'use client';

export default function AddTaskButton() {
  const trigger = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('sanctum-open-add-task'));
  };

  return (
    <button type="button" className="add-task-button" onClick={trigger}>
      + Add Task
    </button>
  );
}
