import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a task', () => {
    const task = service.addTask('Test Task', 'Test notes');
    expect(task.title).toBe('Test Task');
    expect(task.notes).toBe('Test notes');
    expect(task.completed).toBe(false);
  });

  it('should update a task', () => {
    const task = service.addTask('Test Task');
    service.updateTask(task.id, { title: 'Updated Task' });
    const updated = service.getTaskById(task.id);
    expect(updated?.title).toBe('Updated Task');
  });

  it('should delete a task', () => {
    const task = service.addTask('Test Task');
    service.deleteTask(task.id);
    const deleted = service.getTaskById(task.id);
    expect(deleted).toBeUndefined();
  });

  it('should toggle task completion', () => {
    const task = service.addTask('Test Task');
    expect(task.completed).toBe(false);
    service.toggleComplete(task.id);
    const toggled = service.getTaskById(task.id);
    expect(toggled?.completed).toBe(true);
  });

  it('should increment pomodoro count', () => {
    const task = service.addTask('Test Task');
    service.incrementPomodoro(task.id, 25);
    const updated = service.getTaskById(task.id);
    expect(updated?.pomodorosCompleted).toBe(1);
    expect(updated?.totalFocusMinutes).toBe(25);
  });

  it('should filter active and completed tasks', () => {
    const task1 = service.addTask('Active Task');
    const task2 = service.addTask('Completed Task');
    service.toggleComplete(task2.id);

    const activeTasks = service.activeTasks();
    const completedTasks = service.completedTasks();

    expect(activeTasks.length).toBe(1);
    expect(completedTasks.length).toBe(1);
    expect(activeTasks[0].id).toBe(task1.id);
    expect(completedTasks[0].id).toBe(task2.id);
  });
});
